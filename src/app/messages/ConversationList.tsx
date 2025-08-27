
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/messages';

interface ConversationListProps {
    conversations: Conversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
    const params = useParams();
    const activeConversationId = params.otherUserId;

    if (conversations.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    You have no messages yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-2">
                <ul className="space-y-1">
                    {conversations.map(convo => (
                        <li key={convo.otherUser._id}>
                            <Link href={`/messages/${convo.otherUser._id}`} className={cn(
                                "flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors",
                                activeConversationId === convo.otherUser._id && "bg-secondary"
                            )}>
                                <Avatar>
                                    <AvatarImage src={convo.otherUser.avatar} alt={convo.otherUser.name} />
                                    <AvatarFallback>{convo.otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold truncate">{convo.otherUser.name}</p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.messageText}</p>
                                </div>
                                {convo.unreadCount > 0 && (
                                    <Badge className="bg-primary">{convo.unreadCount}</Badge>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
