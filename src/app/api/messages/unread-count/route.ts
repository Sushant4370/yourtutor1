
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MessageModel from '@/models/Message';
import mongoose from 'mongoose';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        // Return 0 if not logged in, no need to error
        return NextResponse.json({ unreadCount: 0 });
    }

    try {
        await dbConnect();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const unreadCount = await MessageModel.countDocuments({
            receiverId: userId,
            isRead: false,
        });

        return NextResponse.json({ unreadCount });
    } catch (error) {
        console.error("[API/unread-count] Error fetching unread count:", error);
        // In case of error, return 0 to prevent a broken UI icon
        return NextResponse.json({ unreadCount: 0 });
    }
}

    