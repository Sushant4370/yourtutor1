
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import TutorProfileModel from '@/models/TutorProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Mail, DollarSign, BookOpen, Calendar, ShieldCheck, ShieldAlert, ShieldX, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { TutorReviewForm } from '@/components/admin/TutorReviewForm';

export const dynamic = 'force-dynamic';

const statusMap: { [key: string]: { icon: React.ElementType, color: string, text: string, variant: "default" | "secondary" | "destructive" | "outline" | null | undefined } } = {
  unverified: { icon: ShieldAlert, color: "text-yellow-600", text: "Unverified", variant: "outline" },
  pending: { icon: ShieldAlert, color: "text-blue-600", text: "Pending Review", variant: "secondary" },
  approved: { icon: ShieldCheck, color: "text-green-600", text: "Approved", variant: "default" },
  rejected: { icon: ShieldX, color: "text-red-600", text: "Rejected", variant: "destructive" },
};

function StatusBadge({ status }: { status: 'unverified' | 'pending' | 'approved' | 'rejected' }) {
    const { icon: Icon, color, text, variant } = statusMap[status] || statusMap.unverified;
    return (
        <Badge variant={variant} className={`capitalize ${color} border-current/30`}>
            <Icon className="w-4 h-4 mr-2" />
            {text}
        </Badge>
    );
}

export default async function AdminTutorReviewPage({ params }: { params: { id: string } }) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return notFound();
  }

  const tutorId = new mongoose.Types.ObjectId(params.id);

  const tutor = await UserModel.findById(tutorId).lean();
  const profile = await TutorProfileModel.findOne({ tutorId }).lean();

  if (!tutor) {
    return notFound();
  }
  
  return (
    <div className="bg-secondary/50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/tutors" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Tutors List
                </Link>
            </Button>
        </div>
        <h1 className="font-headline text-4xl font-bold mb-8">Tutor Application Review</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">Applicant Details</CardTitle>
                    <CardDescription>Core user account and status information.</CardDescription>
                </div>
                <StatusBadge status={tutor.tutorStatus} />
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-3"><User className="w-5 h-5 text-muted-foreground" /><span className="font-semibold">{tutor.name}</span></div>
                 <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-muted-foreground" /><span className="font-mono">{tutor.email}</span></div>
                 {tutor.tutorStatus === 'rejected' && tutor.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                        <p className="font-semibold text-destructive">Last Rejection Reason:</p>
                        <p className="text-sm text-destructive/80">{tutor.rejectionReason}</p>
                    </div>
                 )}
              </CardContent>
            </Card>

            {profile ? (
                <>
                    <Card>
                        <CardHeader><CardTitle>Submitted Profile</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div><h3 className="font-semibold text-lg mb-2">Bio / Introduction</h3><p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-muted-foreground" /><span className="font-semibold">{profile.subjects.join(', ')}</span></div>
                                <div className="flex items-center gap-3"><DollarSign className="w-5 h-5 text-muted-foreground" /><span className="font-semibold">${profile.hourlyRate} / hour</span></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Qualifications</CardTitle></CardHeader>
                        <CardContent>
                            {profile.qualifications.length > 0 ? (
                                <ul className="space-y-3">
                                {profile.qualifications.map(q => (
                                    <li key={q.publicId}>
                                        <a href={q.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary transition-colors">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="font-semibold">{q.originalFilename}</p>
                                                <p className="text-sm text-muted-foreground">{q.fileType} - Uploaded on {format(new Date(q.uploadedAt), "PPP")}</p>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                                </ul>
                            ) : (<p className="text-muted-foreground">No qualification documents were uploaded.</p>)}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
                        <CardContent>
                             {profile.availability.length > 0 ? (
                                <ul className="space-y-2">
                                    {profile.availability.map((a, i) => (
                                        <li key={i} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/30">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{format(new Date(a.date), "PPP")}</span>
                                            <span className="text-muted-foreground">{a.startTime} - {a.endTime}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-muted-foreground">No availability slots were added.</p>)}
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardHeader><CardTitle>No Profile Submitted</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">This tutor has not submitted a profile for review yet.</p></CardContent>
                </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
                <TutorReviewForm tutorId={tutor._id.toString()} currentStatus={tutor.tutorStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
