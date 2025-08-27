
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the Message type locally to avoid importing server-side code.
type Message = {
  role: 'user' | 'model';
  content: string;
};

export function Chatbot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm the YourTutor Assistant. I can help you find tutors, understand how to book a session, or answer questions about the platform. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };

    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunkValue = decoder.decode(value);

        if (chunkValue) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            // Create a new message object with the updated content
            const updatedLastMessage = {
              ...lastMessage,
              content: lastMessage.content + chunkValue,
            };
            // Return a new array with the last message replaced
            return [
              ...prevMessages.slice(0, -1),
              updatedLastMessage,
            ];
          });
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = 'Sorry, I encountered an error. Please try again.';
      // We need to remove the optimistic empty model message before adding the error
      setMessages(prev => {
          const last = prev[prev.length -1];
          if (last.role === 'model' && last.content === '') {
              return [...prev.slice(0, -1), { role: 'model', content: errorMsg }];
          }
          return [...prev, { role: 'model', content: errorMsg }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsOpen(!isOpen)} size="lg" className="rounded-full h-16 w-16 shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground">
          {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
          <span className="sr-only">{isOpen ? 'Close Chat' : 'Open Chat'}</span>
        </Button>
      </div>

      <div className={cn(
        "fixed bottom-24 right-4 z-50 transition-all duration-300 ease-in-out",
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        <Card className="w-[350px] h-[500px] flex flex-col shadow-xl">
          <CardHeader className="p-4 border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><Bot /> YourTutor Assistant</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
             <ScrollArea className="h-full w-full p-4">
                 <div className="space-y-4">
                    {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {message.role === 'model' && (
                        <div className="p-1.5 rounded-full bg-primary/20"><Bot className="w-5 h-5 text-primary flex-shrink-0" /></div>
                        )}

                        {message.content ? (
                            <div className={cn(
                                "max-w-[80%] rounded-lg p-3 text-sm",
                                "bg-secondary text-secondary-foreground"
                            )}>
                                <article className={cn("prose prose-sm", 'dark:prose-invert')}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                                </article>
                            </div>
                        ) : (
                            <div className="bg-secondary p-3 rounded-lg"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        )}

                        {message.role === 'user' && (
                        <div className="p-1.5 rounded-full bg-secondary"><User className="w-5 h-5 text-secondary-foreground flex-shrink-0" /></div>
                        )}
                    </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
