
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { ConversationList } from "./ConversationList";
import { getConversations } from "@/lib/messages";

export const dynamic = 'force-dynamic';

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login?callbackUrl=/messages');
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const conversations = await getConversations(userId);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="font-headline text-4xl font-bold mb-8">Messages</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                <aside className="md:col-span-1 lg:col-span-1">
                    <ConversationList conversations={conversations} />
                </aside>
                <main className="md:col-span-2 lg:col-span-3">
                    {children}
                </main>
            </div>
        </div>
    );
}
