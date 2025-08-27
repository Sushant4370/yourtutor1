
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import TutorProfileModel from '@/models/TutorProfile';
import mongoose from 'mongoose';

const availabilitySchema = z.object({
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const updateAvailabilitySchema = z.object({
    availability: z.array(availabilitySchema),
});

export async function updateAvailabilityAction(prevState: any, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'tutor' || session.user.tutorStatus !== 'approved') {
        return { success: false, error: 'Not authorized or profile not approved.', message: null };
    }

    const availabilityJson = formData.get('availability') as string;
    let availabilityData: { date: string, startTime: string, endTime: string }[] = [];

    try {
        availabilityData = JSON.parse(availabilityJson || '[]');
    } catch (e) {
        return { success: false, error: 'Invalid data format.', message: null };
    }


    const parsedAvailability = availabilityData.map(slot => ({
        ...slot,
        date: new Date(slot.date),
    }));

    const parsed = updateAvailabilitySchema.safeParse({ availability: parsedAvailability });

    if (!parsed.success) {
        console.error("Availability validation failed:", parsed.error);
        return { success: false, error: 'Invalid availability data provided.', message: null };
    }

    const tutorId = new mongoose.Types.ObjectId(session.user.id);

    try {
        await dbConnect();
        const profile = await TutorProfileModel.findOneAndUpdate(
            { tutorId },
            { $set: { availability: parsed.data.availability } },
            { new: true, upsert: false } // don't create if it doesn't exist
        );

        if (!profile) {
            return { success: false, error: 'Tutor profile not found.', message: null };
        }

        revalidatePath('/tutors');
        revalidatePath(`/tutors/${tutorId.toString()}`);
        revalidatePath('/tutor/availability');

        return { success: true, message: 'Availability updated successfully!', error: null };
    } catch (error) {
        console.error('[Update Availability Action Error]:', error);
        return { success: false, error: 'A server error occurred.', message: null };
    }
}
