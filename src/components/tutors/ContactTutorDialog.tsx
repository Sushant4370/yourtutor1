
'use client';

import { useState, useActionState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import type { Tutor } from '@/lib/types';
import { sendMessage } from '@/app/messages/actions';

interface ContactTutorDialogProps {
  tutor: Tutor;
  children: React.ReactNode;
}

const initialState = { success: false, message: null, error: null };

export function ContactTutorDialog({ tutor, children }: ContactTutorDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Message Sent!',
        description: 'The tutor has been notified.',
      });
      setIsOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {tutor.name}</DialogTitle>
          <DialogDescription>
            Ask a question about their experience, availability, or anything else before you book.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
            <input type="hidden" name="receiverId" value={tutor.id} />
            <div className="space-y-2 py-2">
            <Label htmlFor="messageText">Your Message</Label>
            <Textarea
                id="messageText"
                name="messageText"
                placeholder={`Hi ${tutor.name}, I'd like to ask about...`}
                rows={6}
                required
                minLength={10}
            />
            {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
            </div>
            <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button type="button" variant="ghost">
                Cancel
                </Button>
            </DialogClose>
            <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Send Message
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
