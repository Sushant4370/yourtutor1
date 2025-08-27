
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { handleInquiry } from '@/app/contact/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

const initialState = {
  success: false,
  message: null,
  errors: null,
};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(handleInquiry, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Message Sent!',
        description: state.message,
      });
      formRef.current?.reset();
    } else if (state.message && !state.success && !state.errors) {
      // Handle server errors that are not validation errors
      toast({
        title: 'An Error Occurred',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required disabled={isPending} />
              {state.errors?.name && <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isPending} />
               {state.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input id="subject" name="subject" placeholder="e.g., Question about billing" disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" placeholder="Your message..." rows={6} required disabled={isPending} />
             {state.errors?.message && <p className="text-sm font-medium text-destructive">{state.errors.message[0]}</p>}
          </div>

           {state.message && !state.success && !state.errors && (
                <div className="text-sm font-medium text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {state.message}
                </div>
            )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
