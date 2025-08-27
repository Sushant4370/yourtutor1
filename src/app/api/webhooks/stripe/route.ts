
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/db';
import BookingModel from '@/models/Booking';
import { sendBookingEmails } from '@/lib/nodemailer';
import { createZoomMeeting } from '@/lib/zoom';
import UserModel from '@/models/User';
import TutorProfileModel from '@/models/TutorProfile';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handles the logic for fulfilling a booking after a successful payment.
 * This includes updating the booking status and sending confirmation emails.
 * @param session The Stripe Checkout Session object.
 */
const fulfillBooking = async (session: Stripe.Checkout.Session) => {
    const bookingId = session.metadata?.bookingId;
    const startTime = session.metadata?.startTime;

    if (!bookingId) {
        console.error(`❌ [Webhook] fulfillBooking: Missing bookingId in session metadata for session ${session.id}`);
        return;
    }

    try {
        await dbConnect();
        
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            console.error(`❌ [Webhook] Booking with ID ${bookingId} not found in database.`);
            return;
        }

        // Idempotency check: if already scheduled, do nothing.
        if (booking.status === 'scheduled') {
            console.log(`- [Webhook] Booking ${bookingId} has already been scheduled. Ignoring event.`);
            return;
        }
        
        // 0. REMOVE AVAILABILITY SLOT (Robust date/time method)
        if (startTime) {
            try {
                const bookedDate = new Date(booking.sessionDate);
                // Get the start and end of the UTC day for the booking
                const dayStart = new Date(bookedDate);
                dayStart.setUTCHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setUTCHours(23, 59, 59, 999);

                const updateResult = await TutorProfileModel.updateOne(
                    { tutorId: booking.tutorId },
                    {
                        $pull: {
                            availability: {
                                startTime: startTime,
                                date: { $gte: dayStart, $lte: dayEnd } // Match the slot within the correct UTC day
                            }
                        }
                    }
                );
                
                if (updateResult.modifiedCount > 0) {
                    console.log(`- [Webhook] Availability slot removed for tutor ${booking.tutorId} for time ${startTime} on ${dayStart.toISOString().split('T')[0]}.`);
                    revalidatePath(`/tutors/${booking.tutorId.toString()}`);
                } else {
                    console.warn(`- [Webhook] Could not find matching availability slot to remove for tutor ${booking.tutorId}. It might have been removed already.`);
                }
            } catch (availError: any) {
                console.error(`❌ [Webhook] CRITICAL: Failed to remove availability for booking ${bookingId}. Error: ${availError.message}.`);
            }
        } else {
            console.warn(`- [Webhook] fulfillBooking: Missing startTime in session metadata for session ${session.id}. Cannot remove availability slot.`);
        }


        // Fetch both student and tutor in one go
        const [student, tutor] = await Promise.all([
            UserModel.findById(booking.studentId),
            UserModel.findById(booking.tutorId)
        ]);

        if (!student) {
             console.error(`❌ [Webhook] Student with ID ${booking.studentId} for booking ${bookingId} not found.`);
             return;
        }
        if (!tutor) {
             console.error(`❌ [Webhook] Tutor with ID ${booking.tutorId} for booking ${bookingId} not found.`);
             return;
        }

        // 1. CREATE ZOOM MEETING
        let zoomMeeting;
        try {
            zoomMeeting = await createZoomMeeting(booking, tutor);
            booking.meetingUrl = zoomMeeting.join_url;
            booking.meetingStartUrl = zoomMeeting.start_url;
            booking.meetingId = zoomMeeting.id;
            booking.meetingPassword = zoomMeeting.password;
            console.log(`- [Webhook] Zoom meeting created for booking ${bookingId}.`);
        } catch (zoomError: any) {
            console.error(`❌ [Webhook] CRITICAL: Failed to create Zoom meeting for booking ${bookingId}. Error: ${zoomError.message}. Proceeding without meeting link.`);
            // Continue without a meeting link so booking is still confirmed. Can be manually fixed later.
        }

        // 2. UPDATE BOOKING STATUS
        booking.status = 'scheduled';
        const updatedBooking = await booking.save();
        console.log(`- [Webhook] Booking ${bookingId} successfully updated and marked as 'scheduled'.`);
        
        // 3. REVALIDATE CACHE
        revalidatePath('/my-classes');
        console.log(`- [Webhook] Revalidated /my-classes path.`);
        
        // 4. SEND CONFIRMATION EMAILS (pass fetched user objects to avoid re-querying)
        await sendBookingEmails(updatedBooking, student, tutor);
        console.log(`- [Webhook] Customer and Tutor emails queued for sending for booking ${bookingId}.`);

    } catch (error: any) {
        console.error(`❌ [Webhook] fulfillBooking: Database or email error for booking ${bookingId}: ${error.message}`);
    }
};


export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('❌ FATAL: STRIPE_WEBHOOK_SECRET is not set. Webhook cannot be verified.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`✅ [Webhook] Received Stripe event: ${event.type} | ID: ${event.id}`);
  
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`- [Webhook] Handling successful checkout for Session ID: ${session.id}`);
    await fulfillBooking(session);
  } else {
    console.log(`- [Webhook] Received unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
