
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { sendMessage } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Send, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { IMessage } from '@/models/Message';
import type { IUser } from '@/models/User';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface MessageThreadProps {
    initialMessages: IMessage[];
    otherUser: IUser;
    currentUserId: string;
}

const initialState = { success: false, message: null, error: null };

export function MessageThread({ initialMessages, otherUser, currentUserId }: MessageThreadProps) {
    const { data: session } = useSession();
    const currentUser = session?.user;

    const [state, formAction] = useActionState(sendMessage, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isPending, startTransition] = useTransition();
    const [hasMounted, setHasMounted] = useState(false);
    const [messages, setMessages] = useState(initialMessages);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state]);

    // Polling for new messages
    useEffect(() => {
        const fetchNewMessages = async () => {
             try {
                const response = await fetch(`/api/messages/${otherUser._id.toString()}`);
                if (response.ok) {
                    const newMessages: IMessage[] = await response.json();
                    if (newMessages.length !== messages.length || (newMessages.length > 0 && newMessages[newMessages.length - 1]._id.toString() !== messages[messages.length - 1]?._id.toString())) {
                        setMessages(newMessages);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch new messages", error);
            }
        };

        const interval = setInterval(fetchNewMessages, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [otherUser._id, messages]); // `messages` is a dependency to compare against new data

    const handleFormSubmit = (formData: FormData) => {
        const messageText = formData.get('messageText') as string;
        if (!messageText.trim()) return;

        startTransition(() => {
            const optimisticMessage: IMessage = {
                _id: Date.now().toString() as any,
                senderId: currentUserId as any,
                receiverId: otherUser._id,
                messageText,
                isRead: true,
                createdAt: new Date(),
            };
            setMessages(prev => [...prev, optimisticMessage]);
            formAction(formData);
        });
    }
    
    return (
        <Card className="flex flex-col h-full max-h-[80vh]">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                 <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-lg">{otherUser.name}</h2>
                        <Badge variant="secondary" className="capitalize">{otherUser.role}</Badge>
                    </div>
                </div>
                {otherUser.role === 'tutor' && otherUser.tutorStatus === 'approved' && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/tutors/${otherUser._id.toString()}`}>
                            View Profile
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">This is the beginning of your conversation with {otherUser.name}.</p>
                        <p>Send a message to get started.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                         <div key={msg._id.toString()} className={cn(
                            "flex items-start gap-3",
                            msg.senderId.toString() === currentUserId && "flex-row-reverse"
                        )}>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.senderId.toString() === currentUserId ? currentUser?.image || undefined : otherUser.avatar} />
                                <AvatarFallback>{(msg.senderId.toString() === currentUserId ? currentUser?.name?.charAt(0) : otherUser.name.charAt(0))?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "max-w-xs md:max-w-md p-3 rounded-lg",
                                msg.senderId.toString() === currentUserId ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}>
                                <p className="text-sm">{msg.messageText}</p>
                                <div className={cn(
                                    "text-xs mt-1",
                                    msg.senderId.toString() === currentUserId ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                                )}>
                                    {hasMounted ? format(new Date(msg.createdAt), 'p') : <Skeleton className="h-4 w-10 inline-block" />}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="border-t pt-4">
                <form ref={formRef} action={handleFormSubmit} className="flex w-full items-center space-x-2">
                    <input type="hidden" name="receiverId" value={otherUser._id.toString()} />
                    <Input name="messageText" placeholder="Type a message..." autoComplete="off" disabled={isPending}/>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}

    