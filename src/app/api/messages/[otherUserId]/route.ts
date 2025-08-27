
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MessageModel from '@/models/Message';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { otherUserId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!params.otherUserId || !mongoose.Types.ObjectId.isValid(params.otherUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const userId = new mongoose.Types.ObjectId(session.user.id);
  const otherUserId = new mongoose.Types.ObjectId(params.otherUserId);

  await dbConnect();

  // Mark messages from this specific user as read
  await MessageModel.updateMany(
    { senderId: otherUserId, receiverId: userId, isRead: false },
    { $set: { isRead: true } }
  );

  const messages = await MessageModel.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).sort({ createdAt: 'asc' }).lean();

  return NextResponse.json(messages);
}

    