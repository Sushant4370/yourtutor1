'use client';

import { useActionState, useEffect, useState } from 'react';
import { submitFeedback } from '@/app/my-classes/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

const initialState = {
  success: false,
  message: null,
  error: null,
};

interface FeedbackFormProps {
  bookingId: string;
  tutorId: string;
  subject: string;
}

export function FeedbackForm({ bookingId, tutorId, subject }: FeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(submitFeedback, initialState);
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state?.success && state.message) {
      toast({ title: 'Success!', description: state.message });
      setIsOpen(false);
      setRating(0); 
    } else if (state?.error) {
      toast({ title: 'Error', description: state.error, variant: 'destructive' });
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Leave Feedback</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>Rate your experience for the <strong>{subject}</strong> session.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="tutorId" value={tutorId} />
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="rating" value={rating} />
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating*</Label>
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={starValue}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(0)}
                      className="text-gray-300"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors cursor-pointer ${starValue <= (hover || rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Tell us more about your session..."
                rows={4}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={rating === 0 || isPending}>
              {isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
