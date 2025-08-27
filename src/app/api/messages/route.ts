
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import * as z from 'zod';

import dbConnect from '@/lib/db';
import MessageModel from '@/models/Message';
import UserModel from '@/models/User';
import { sendNewMessageNotificationEmail } from '@/lib/nodemailer';

const messageSchema = z.object({
  tutorId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  messageText: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message cannot exceed 1000 characters."),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const studentId = new mongoose.Types.ObjectId(token.id as string);

  try {
    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data provided.', details: parsed.error.format() }, { status: 400 });
    }

    const { tutorId: tutorIdString, messageText } = parsed.data;
    const tutorId = new mongoose.Types.ObjectId(tutorIdString);

    if (studentId.equals(tutorId)) {
        return NextResponse.json({ error: 'You cannot send a message to yourself.' }, { status: 400 });
    }

    await dbConnect();

    // Fetch student and tutor details for the email
    const [student, tutor] = await Promise.all([
      UserModel.findById(studentId).lean(),
      UserModel.findById(tutorId).lean()
    ]);

    if (!student || !tutor) {
      return NextResponse.json({ error: 'Could not find student or tutor.' }, { status: 404 });
    }
    
    // Create the message in the database
    await MessageModel.create({
      senderId: studentId,
      receiverId: tutorId,
      messageText,
    });

    // Send email notification to the tutor
    await sendNewMessageNotificationEmail(student, tutor, messageText);

    return NextResponse.json({ success: true, message: 'Your message has been sent!' }, { status: 201 });

  } catch (error: any) {
    console.error(`[Message API Error] Failed to send message from ${token.id}:`, error);
    return NextResponse.json({ error: 'A server error occurred while sending the message.' }, { status: 500 });
  }
}
