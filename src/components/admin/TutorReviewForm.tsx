'use client';

import { useActionState, useEffect } from 'react';
import { updateTutorStatus } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, ShieldX } from 'lucide-react';

const initialState = {
    success: false,
    message: null,
    error: null,
};

export function TutorReviewForm({ tutorId, currentStatus }: { tutorId: string, currentStatus: string }) {
    const [state, formAction] = useActionState(updateTutorStatus, initialState);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success && state.message) {
            toast({
                title: 'Success!',
                description: state.message,
            });
        } else if (state?.error) {
            toast({
                title: 'Error',
                description: state.error,
                variant: 'destructive',
            });
        }
    }, [state, toast]);
    
    const showApproveForm = currentStatus !== 'approved';
    const showRejectForm = currentStatus !== 'rejected';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Review & Take Action</CardTitle>
                <CardDescription>Approve or reject this application. The tutor will be notified via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentStatus === 'approved' && (
                    <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <AlertTitle>Tutor Approved</AlertTitle>
                        <AlertDescription>This tutor's profile is live and visible to students.</AlertDescription>
                    </Alert>
                )}
                {currentStatus === 'rejected' && (
                     <Alert variant="destructive">
                        <ShieldX className="h-4 w-4" />
                        <AlertTitle>Tutor Rejected</AlertTitle>
                        <AlertDescription>This tutor's application was rejected and they have been notified.</AlertDescription>
                    </Alert>
                )}

                {showApproveForm && (
                     <form action={formAction} className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <input type="hidden" name="tutorId" value={tutorId} />
                        <input type="hidden" name="status" value="approved" />
                        <h3 className="font-semibold text-green-800">Approve Application</h3>
                        <p className="text-sm text-green-700 mb-4">The tutor's profile will go live.</p>
                        <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700">Approve Tutor</Button>
                    </form>
                )}

                {showRejectForm && (
                    <form action={formAction} className="p-4 border rounded-lg bg-red-50 border-red-200">
                        <input type="hidden" name="tutorId" value={tutorId} />
                        <input type="hidden" name="status" value="rejected" />
                        <h3 className="font-semibold text-red-800">Reject Application</h3>
                        <div className="space-y-2 my-4">
                            <Label htmlFor="rejectionReason" className="text-red-800">Rejection Reason (Required)</Label>
                            <Textarea id="rejectionReason" name="rejectionReason" placeholder="Provide a clear reason for rejection (e.g., 'Qualifications provided do not meet our requirements for teaching Physics.')..." required className="bg-white"/>
                        </div>
                        <Button type="submit" variant="destructive">Reject Tutor</Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
