'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import FeedbackModel from '@/models/Feedback';
import BookingModel from '@/models/Booking';
import mongoose from 'mongoose';
import { sendRescheduleRequestEmail } from '@/lib/nodemailer';
import type { IUser } from '@/models/User';

const feedbackSchema = z.object({
  bookingId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  tutorId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  subject: z.string().min(1, 'Subject is required'),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitFeedback(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: 'Not authenticated.', message: null };
  }

  const parsed = feedbackSchema.safeParse({
    bookingId: formData.get('bookingId'),
    tutorId: formData.get('tutorId'),
    subject: formData.get('subject'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  });

  if (!parsed.success) {
    console.error('Feedback validation error:', parsed.error);
    return { success: false, error: 'Invalid data provided.', message: null };
  }

  const { bookingId, tutorId, rating, comment, subject } = parsed.data;

  try {
    await dbConnect();

    const existingFeedback = await FeedbackModel.findOne({ sessionId: bookingId });
    if (existingFeedback) {
      return { success: false, error: 'Feedback has already been submitted for this session.', message: null };
    }

    await FeedbackModel.create({
      studentId: new mongoose.Types.ObjectId(session.user.id),
      tutorId: new mongoose.Types.ObjectId(tutorId),
      sessionId: new mongoose.Types.ObjectId(bookingId),
      rating: rating,
      comment: comment,
      subject: subject,
    });

    await BookingModel.findByIdAndUpdate(bookingId, { feedbackSubmitted: true });
    
    revalidatePath('/my-classes');
    revalidatePath(`/tutors/${tutorId}`);
    revalidatePath('/tutors');

    return { success: true, message: 'Thank you for your feedback!', error: null };
  } catch (error: any) {
    // Gracefully handle unique constraint violation from the database
    if ((error as any).code === 11000) {
        return { success: false, error: 'Feedback has already been submitted for this session.', message: null };
    }
    console.error('[Feedback Action Error]:', error);
    return { success: false, error: 'A server error occurred.', message: null };
  }
}

const rescheduleSchema = z.object({
  bookingId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  reason: z.string().min(10, 'Please provide a reason (minimum 10 characters).').max(500),
});

export async function requestReschedule(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: 'Not authenticated.', message: null };
  }

  const parsed = rescheduleSchema.safeParse({
    bookingId: formData.get('bookingId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    const error = parsed.error.flatten().fieldErrors.reason?.[0];
    return { success: false, error: error || 'Invalid data provided.', message: null };
  }

  const { bookingId, reason } = parsed.data;

  try {
    await dbConnect();

    const booking = await BookingModel.findById(bookingId).populate('studentId').populate('tutorId');

    if (!booking) {
      return { success: false, error: 'Booking not found.', message: null };
    }

    const currentUserId = session.user.id;
    const student = booking.studentId as unknown as IUser;
    const tutor = booking.tutorId as unknown as IUser;

    if (student._id.toString() !== currentUserId && tutor._id.toString() !== currentUserId) {
        return { success: false, error: 'You are not authorized to modify this booking.', message: null };
    }

    if (booking.status !== 'scheduled') {
        return { success: false, error: 'Only scheduled sessions can be rescheduled.', message: null };
    }

    const requesterRole = student._id.toString() === currentUserId ? 'student' : 'tutor';
    
    booking.status = 'reschedule_requested';
    booking.rescheduleRequesterRole = requesterRole;
    await booking.save();

    await sendRescheduleRequestEmail(booking, student, tutor, requesterRole, reason);

    revalidatePath('/my-classes');

    return { success: true, message: 'Reschedule request sent. The other party has been notified.', error: null };
  } catch (error: any) {
    console.error('[Reschedule Action Error]:', error);
    return { success: false, error: 'A server error occurred.', message: null };
  }
}
