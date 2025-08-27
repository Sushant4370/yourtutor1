
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import * as z from 'zod';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';

const saveAvatarSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = saveAvatarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data provided. A valid URL is required.' }, { status: 400 });
    }

    const { url } = parsed.data;

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(token.id as string);
    
    // Use findByIdAndUpdate for a direct, atomic update.
    // This is more reliable than the find-then-save pattern.
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { avatar: url } },
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    if (!updatedUser) {
        return NextResponse.json({ error: 'User not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile picture updated!', newImageUrl: updatedUser.avatar }, { status: 200 });

  } catch (error: any) {
    console.error(`[Avatar Save API Error] Failed to save avatar for ${token.id}:`, error);
    return NextResponse.json({ error: 'A server error occurred while saving the avatar.' }, { status: 500 });
  }
}
