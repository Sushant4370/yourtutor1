
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import MessageModel, { IMessage } from '@/models/Message';
import UserModel from '@/models/User';
import mongoose from 'mongoose';
import { MessageThread } from '../MessageThread';

export const dynamic = 'force-dynamic';

interface MessageThreadPageProps {
    params: {
        otherUserId: string;
    };
}

async function getMessageThread(userId: mongoose.Types.ObjectId, otherUserId: mongoose.Types.ObjectId) {
    await dbConnect();
    
    // Mark messages as read
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

    const otherUser = await UserModel.findById(otherUserId).lean();

    return {
        messages: JSON.parse(JSON.stringify(messages)) as IMessage[],
        otherUser: JSON.parse(JSON.stringify(otherUser))
    };
}


export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login?callbackUrl=/messages');
    }
    
    if (!mongoose.Types.ObjectId.isValid(params.otherUserId)) {
        return redirect('/messages');
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const otherUserId = new mongoose.Types.ObjectId(params.otherUserId);
    
    const { messages, otherUser } = await getMessageThread(userId, otherUserId);
    
    if (!otherUser) {
        return redirect('/messages');
    }

    return (
        <MessageThread 
            initialMessages={messages} 
            otherUser={otherUser} 
            currentUserId={session.user.id}
        />
    );
}
