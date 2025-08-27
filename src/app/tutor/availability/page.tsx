
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import TutorProfileModel from '@/models/TutorProfile';
import mongoose from 'mongoose';
import { AvailabilityForm } from '@/components/tutor/availability/AvailabilityForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ManageAvailabilityPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'tutor') {
        redirect('/login?callbackUrl=/tutor/availability');
    }
    
    // Only approved tutors can manage availability this way
    if (session.user.tutorStatus !== 'approved') {
        return (
            <div className="container mx-auto px-4 py-12">
                 <div className="max-w-2xl mx-auto">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Profile Not Approved</AlertTitle>
                        <AlertDescription>
                            Your profile must be approved before you can manage your availability here.
                            Please complete your profile submission first.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }
    
    await dbConnect();
    const tutorId = new mongoose.Types.ObjectId(session.user.id);
    const profile = await TutorProfileModel.findOne({ tutorId }).lean();
    
    const initialAvailability = profile?.availability.map(a => ({
        date: a.date.toISOString(),
        startTime: a.startTime,
        endTime: a.endTime,
    })) || [];
    
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                 <h1 className="font-headline text-4xl font-bold mb-2 text-center">Manage Your Availability</h1>
                <p className="text-muted-foreground text-center mb-8">
                    Add or remove time slots. Changes are saved instantly and will be visible to students.
                </p>
                <AvailabilityForm initialAvailability={initialAvailability} />
            </div>
        </div>
    )
}
