
'use client';

import { useActionState, useEffect, useState } from 'react';
import { requestReschedule } from '@/app/my-classes/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState = {
  success: false,
  message: null,
  error: null,
};

interface RescheduleDialogProps {
  bookingId: string;
}

export function RescheduleDialog({ bookingId }: RescheduleDialogProps) {
  const [state, formAction, isPending] = useActionState(requestReschedule, initialState);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (state.success && state.message) {
      toast({ title: 'Success!', description: state.message });
      setIsOpen(false);
      setReason('');
    } else if (state.error) {
      toast({ title: 'Error', description: state.error, variant: 'destructive' });
    }
  }, [state, toast]);
  
  // Reset form state if dialog is closed without submitting
  useEffect(() => {
    if (!isOpen) {
        setReason('');
        // A way to reset action state if needed, though often not necessary
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Request Reschedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request to Reschedule Session</DialogTitle>
          <DialogDescription>A notification will be sent to the other party. Please provide a reason for your request.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rescheduling*</Label>
              <Textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., I have a conflicting appointment..."
                rows={4}
                required
                minLength={10}
                disabled={isPending}
              />
              {state?.error && <p className="text-sm font-medium text-destructive mt-1">{state.error}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || reason.length < 10}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
