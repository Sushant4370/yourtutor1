
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { sendTutorStatusUpdateEmail } from '@/lib/nodemailer';

const updateStatusSchema = z.object({
  tutorId: z.string(),
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().nullish().transform(val => val ?? undefined),
});

export async function updateTutorStatus(prevState: any, formData: FormData) {
  const rawData = {
    tutorId: formData.get('tutorId'),
    status: formData.get('status'),
    rejectionReason: formData.get('rejectionReason'),
  };

  const parsed = updateStatusSchema.safeParse(rawData);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data provided.', message: null };
  }

  const { tutorId, status, rejectionReason } = parsed.data;

  if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 10)) {
    return { success: false, error: 'A reason (minimum 10 characters) is required for rejection.', message: null };
  }

  try {
    await dbConnect();
    
    // Prepare the update payload. Role is changed on approval or rejection.
    const updatePayload: { tutorStatus: 'approved' | 'rejected', role?: 'student' | 'tutor', rejectionReason?: string } = {
      tutorStatus: status,
    };

    if (status === 'approved') {
      updatePayload.role = 'tutor';
      updatePayload.rejectionReason = undefined; // Clear any previous rejection reason
    } else { // status === 'rejected'
      updatePayload.role = 'student'; // Revert role to student on rejection
      updatePayload.rejectionReason = rejectionReason;
    }

    const tutor = await UserModel.findByIdAndUpdate(
      tutorId,
      { $set: updatePayload },
      { new: true }
    );

    if (!tutor) {
      return { success: false, error: 'Tutor not found.', message: null };
    }
    
    await sendTutorStatusUpdateEmail(tutor);
    
    // Revalidate all relevant paths
    revalidatePath(`/admin/tutors`);
    revalidatePath(`/admin/tutors/${tutorId}`);
    revalidatePath('/tutors'); // Revalidate the public tutors list page
    revalidatePath(`/tutors/${tutorId}`); // Revalidate the public tutor profile page
    
    return { success: true, message: `Tutor has been ${status}.`, error: null };

  } catch (error: any) {
    console.error(`[Admin Action Error] Failed to update tutor status for ${tutorId}:`, error);
    return { success: false, error: 'A server error occurred.', message: null };
  }
}
