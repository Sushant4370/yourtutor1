
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import InquiryModel from '@/models/Inquiry';
import { sendInquiryEmails } from '@/lib/nodemailer';

const inquirySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export async function handleInquiry(prevState: any, formData: FormData) {
  const parsed = inquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      message: 'Please correct the errors below.',
      errors,
    };
  }

  try {
    await dbConnect();
    const newInquiry = await InquiryModel.create(parsed.data);
    
    // Fire and forget - don't make the user wait for the email to send
    sendInquiryEmails(newInquiry);
    
    return {
      success: true,
      message: 'Thank you for your message! We will get back to you shortly.',
      errors: null,
    };

  } catch (error) {
    console.error('[Contact Action Error]:', error);
    return {
      success: false,
      message: 'A server error occurred. Please try again later.',
      errors: null,
    };
  }
}
