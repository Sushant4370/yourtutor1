
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import * as z from 'zod';
import mongoose from 'mongoose';
import { format } from 'date-fns';

import { authOptions } from "@/lib/auth";
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/db';
import BookingModel from '@/models/Booking';
import TutorProfileModel from '@/models/TutorProfile';
import UserModel from '@/models/User';

const checkoutRequestSchema = z.object({
  tutorId: z.string().refine(id => mongoose.Types.ObjectId.isValid(id), { message: "Invalid tutor ID" }),
  subject: z.string().min(1, "Subject is required"),
  sessionDateTime: z.string().datetime("Invalid date format"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid 24-hour time format"),
});

const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:9002';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const studentId = session.user.id;

    const body = await req.json();
    const parsedBody = checkoutRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request data.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { tutorId, subject, sessionDateTime, startTime } = parsedBody.data;

    await dbConnect();
    
    const tutorProfile = await TutorProfileModel.findOne({ tutorId: new mongoose.Types.ObjectId(tutorId) });
    const tutorUser = await UserModel.findById(tutorId);

    if (!tutorProfile || !tutorUser) {
        return NextResponse.json({ error: "Tutor not found or profile is incomplete." }, { status: 404 });
    }

    const hourlyRate = tutorProfile.hourlyRate;
    if (!hourlyRate || hourlyRate <= 0) {
        return NextResponse.json({ error: "Tutor's hourly rate is not set correctly." }, { status: 400 });
    }

    // The client now sends the exact UTC datetime string, so we just convert it to a Date object.
    const sessionDateObject = new Date(sessionDateTime);

    // Create a booking record with 'pending_payment' status
    const newBooking = new BookingModel({
      studentId,
      tutorId,
      subject,
      sessionDate: sessionDateObject, // Use the correct combined date
      status: 'pending_payment',
    });
    
    await newBooking.save();
    console.log(`[Checkout API] Booking ${newBooking._id} created with pending payment.`);

    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Tutoring Session: ${subject}`,
          description: `1-hour session with ${tutorUser.name} on ${format(sessionDateObject, "PPPp")}.`,
        },
        unit_amount: Math.round(hourlyRate * 100), // Price in cents
      },
      quantity: 1,
    }];
    
    const metadata = {
        bookingId: newBooking._id.toString(),
        studentId: studentId,
        tutorId: tutorId,
        startTime: startTime,
    };

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/my-classes?booking_success=true&booking_id=${newBooking._id.toString()}`,
      cancel_url: `${YOUR_DOMAIN}/tutors/${tutorUser._id.toString()}?booking_cancelled=true`,
      metadata: metadata,
      customer_email: session.user.email,
    });
    
    // Update the booking with the Stripe Session ID for reference
    newBooking.stripeSessionId = stripeSession.id;
    await newBooking.save();

    console.log(`[Checkout API] Stripe session ${stripeSession.id} created for booking ${newBooking._id}. Redirecting user.`);
    return NextResponse.json({ sessionId: stripeSession.id, url: stripeSession.url });

  } catch (error: any) {
    console.error("[Checkout API] Error creating Stripe session:", error);
    return NextResponse.json({ error: 'Failed to create Stripe session.', details: error.message }, { status: 500 });
  }
}
