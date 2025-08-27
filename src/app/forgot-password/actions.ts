
'use server';

import { z } from 'zod';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/nodemailer';

const emailSchema = z.string().email({ message: 'Please enter a valid email address.' });

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return { success: false, message: parsed.error.flatten().fieldErrors['']?.[0] || 'Invalid email format.' };
  }

  try {
    await dbConnect();
    const user = await UserModel.findOne({ email: parsed.data });

    // To prevent email enumeration attacks, we send a success-like message
    // even if the user doesn't exist. The email is only sent if they do.
    if (user) {
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = tokenExpiry;
      await user.save();

      await sendPasswordResetEmail(user.email, user.name, resetToken);
    }
    
    return {
      success: true,
      message: 'If an account with that email exists, we have sent a password reset token to it.',
    };

  } catch (error) {
    console.error('[Forgot Password Action Error]:', error);
    return {
      success: false,
      message: 'A server error occurred. Please try again later.',
    };
  }
}
