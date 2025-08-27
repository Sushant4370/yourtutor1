
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import { getConversations } from '@/lib/messages';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MessagesRootPage() {
    const session = await getServerSession(authOptions);
    // This check is redundant because layout does it, but good for safety
    if (!session?.user) {
        redirect('/login?callbackUrl=/messages');
        return null; // Return null after redirect
    }
    
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const conversations = await getConversations(userId);

    // If there are conversations, redirect to the most recent one.
    if (conversations.length > 0) {
        const firstConversationUserId = conversations[0].otherUser._id;
        redirect(`/messages/${firstConversationUserId}`);
        return null; // Return null after redirect
    }

    // If no conversations, show the placeholder message.
    return (
        <Card className="h-full flex items-center justify-center min-h-[60vh]">
            <CardContent className="p-6 text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-semibold">No messages yet</h2>
                <p>When you start a conversation, it will appear here.</p>
            </CardContent>
        </Card>
    );
}
