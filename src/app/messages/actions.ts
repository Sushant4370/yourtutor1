'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MessageModel from '@/models/Message';
import UserModel from '@/models/User';
import mongoose from 'mongoose';
import { sendNewMessageNotificationEmail } from '@/lib/nodemailer';

const messageSchema = z.object({
  receiverId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  messageText: z.string().min(1, 'Message cannot be empty.').max(1000, 'Message is too long.'),
});

export async function sendMessage(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: 'Not authenticated.', message: null };
  }
  
  const senderId = new mongoose.Types.ObjectId(session.user.id);

  const parsed = messageSchema.safeParse({
    receiverId: formData.get('receiverId'),
    messageText: formData.get('messageText'),
  });

  if (!parsed.success) {
    return { success: false, error: 'Invalid data provided.', message: null };
  }
  
  const { receiverId: receiverIdString, messageText } = parsed.data;
  const receiverId = new mongoose.Types.ObjectId(receiverIdString);
  
  if (senderId.equals(receiverId)) {
    return { success: false, error: 'You cannot send a message to yourself.', message: null };
  }

  try {
    await dbConnect();
    
    await MessageModel.create({
      senderId,
      receiverId,
      messageText,
      isRead: false,
    });
    
    const [sender, receiver] = await Promise.all([
        UserModel.findById(senderId).lean(),
        UserModel.findById(receiverId).lean()
    ]);

    if (!sender || !receiver) {
        return { success: false, error: 'Could not find sender or receiver.', message: null };
    }

    // Fire-and-forget email notification
    sendNewMessageNotificationEmail(sender, receiver, messageText);
    
    revalidatePath(`/messages/${receiverId.toString()}`);
    revalidatePath(`/messages`);
    
    return { success: true, message: 'Message sent!', error: null };
    
  } catch (error) {
    console.error('[SendMessage Action Error]:', error);
    return { success: false, error: 'A server error occurred.', message: null };
  }
}
