
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { redirect } from 'next/navigation';

const resetSchema = z.object({
  token: z.string().length(6, { message: 'Token must be 6 characters.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export async function resetPassword(prevState: any, formData: FormData) {
    const parsed = resetSchema.safeParse({
        token: formData.get('token'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
    });

    if (!parsed.success) {
        return {
            success: false,
            message: 'Please correct the errors below.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }
    
    const { token, password } = parsed.data;

    try {
        await dbConnect();
        
        const user = await UserModel.findOne({
            resetPasswordToken: token.toUpperCase(),
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return {
                success: false,
                message: 'Invalid or expired password reset token.',
                errors: null,
            };
        }

        user.password = password; // The pre-save hook will hash this
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        return {
            success: true,
            message: 'Your password has been successfully reset. You can now log in.',
            errors: null,
        };

    } catch (error) {
        console.error('[Reset Password Action Error]:', error);
        return {
            success: false,
            message: 'A server error occurred. Please try again later.',
            errors: null,
        };
    }
}
