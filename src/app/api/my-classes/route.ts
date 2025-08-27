
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import BookingModel, { IBooking } from '@/models/Booking';
import type { IUser } from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface PopulatedBooking extends Omit<IBooking, 'tutorId' | 'studentId'> {
  _id: any;
  tutorId: IUser;
  studentId: IUser;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await dbConnect();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Corrected Query: Use $or to find bookings where the user is either the student or the tutor.
    const query = {
      $or: [{ studentId: userId }, { tutorId: userId }],
      status: { $in: ['scheduled', 'completed', 'reschedule_requested'] }
    };

    const bookings = await BookingModel.find(query)
      .populate<{ tutorId: IUser }>('tutorId', 'name _id')
      .populate<{ studentId: IUser }>('studentId', 'name _id')
      .sort({ sessionDate: -1 })
      .lean() as PopulatedBooking[];

    const now = new Date();

    const upcomingBookings: PopulatedBooking[] = [];
    const pastBookings: PopulatedBooking[] = [];

    for (const booking of bookings) {
      const sessionDateTime = new Date(booking.sessionDate);
      // A class is in the past if it is marked completed, OR if it was scheduled and its time has passed.
      // A reschedule_requested class is never in the past until it's resolved.
      if (booking.status === 'completed' || (booking.status === 'scheduled' && sessionDateTime < now)) {
        pastBookings.push(booking);
      } else {
        // This covers upcoming 'scheduled' bookings and all 'reschedule_requested' bookings.
        upcomingBookings.push(booking);
      }
    }

    // Sort using the correct Date object
    pastBookings.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    upcomingBookings.sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

    return NextResponse.json({
      upcomingBookings,
      pastBookings,
    });

  } catch (error) {
    console.error('[API/my-classes] Error fetching classes:', error);
    return NextResponse.json({ error: 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
