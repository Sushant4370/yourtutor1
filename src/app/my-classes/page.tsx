
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Clock, Video, User, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { FeedbackForm } from "@/components/classes/FeedbackForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import type { IBooking } from "@/models/Booking";
import { RescheduleDialog } from '@/components/classes/RescheduleDialog';

// Since we are fetching, the populated type will be slightly different on the client
interface PopulatedBookingClient extends Omit<IBooking, 'tutorId' | 'studentId' | '_id' | 'sessionDate'> {
  _id: string; // comes as string from JSON
  tutorId: { name: string; _id: string };
  studentId: { name: string; _id: string };
  sessionDate: string; // comes as string from JSON
  status: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' | 'reschedule_requested';
  rescheduleRequesterRole?: 'student' | 'tutor';
  meetingUrl?: string;
  meetingStartUrl?: string;
}

function MyClassesContent() {
  const searchParams = useSearchParams();
  const showSuccessAlert = searchParams.get('booking_success') === 'true';

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [upcomingBookings, setUpcomingBookings] = useState<PopulatedBookingClient[]>([]);
  const [pastBookings, setPastBookings] = useState<PopulatedBookingClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/my-classes');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch classes.');
        }
        const data = await response.json();
        setUpcomingBookings(data.upcomingBookings);
        setPastBookings(data.pastBookings);
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (isLoading || !session) {
    return <MyClassesSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could Not Load Classes</AlertTitle>
            <AlertDescription>
                There was an error fetching your class schedule. Please try refreshing the page.
                <p className="text-xs mt-2 font-mono">Error: {error}</p>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-4xl font-bold mb-8 text-center">My Classes</h1>
      
      {showSuccessAlert && (
        <Alert variant="default" className="mb-8 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Booking Successful!</AlertTitle>
            <AlertDescription>
                Your session is confirmed and has been added to your schedule below. The tutor has been notified.
            </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <div className="mt-6">
                {upcomingBookings.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="font-headline text-2xl font-semibold mb-2">No Upcoming Classes</h2>
                        <p className="text-muted-foreground mb-4">You haven't booked any classes yet.</p>
                        {session?.user.role === 'student' && (
                            <Button asChild>
                                <Link href="/tutors">Find a Tutor</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                    {upcomingBookings.map((booking) => {
                        const userRoleForBooking = userId === booking.studentId._id ? 'student' : 'tutor';
                        return (
                            <Card key={booking._id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline text-xl">{booking.subject}</CardTitle>
                                        <CardDescription>
                                            {userRoleForBooking === 'student' ? `With ${booking.tutorId.name}` : `With ${booking.studentId.name}`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-5 h-5" />
                                        <span className="capitalize font-medium text-foreground">Your Role: {userRoleForBooking}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span>{format(new Date(booking.sessionDate), "PPP")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>{format(new Date(booking.sessionDate), "p")}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4 p-4 bg-secondary/50">
                                {booking.status === 'reschedule_requested' ? (
                                    <Alert variant="default" className="w-full bg-yellow-50 border-yellow-200 text-yellow-800">
                                    <RefreshCw className="h-4 w-4 text-yellow-600" />
                                    <AlertTitle>Reschedule Requested</AlertTitle>
                                    <AlertDescription>
                                        {booking.rescheduleRequesterRole === userRoleForBooking
                                        ? "You requested to reschedule. "
                                        : (booking.rescheduleRequesterRole === 'student' ? 'The student' : 'The tutor') + " requested to reschedule. "}
                                        Please use Messages to coordinate a new time.
                                    </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="flex w-full justify-between items-center">
                                    {userRoleForBooking === 'tutor' && booking.meetingStartUrl ? (
                                        <Button asChild className="bg-accent hover:bg-accent/90">
                                            <a href={booking.meetingStartUrl} target="_blank" rel="noopener noreferrer">
                                                <Video className="w-5 h-5 mr-2" />
                                                Start Meeting as Host
                                            </a>
                                        </Button>
                                    ) : userRoleForBooking === 'student' && booking.meetingUrl ? (
                                        <Button asChild className="bg-accent hover:bg-accent/90">
                                            <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                                                <Video className="w-5 h-5 mr-2" />
                                                Join Meeting
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled>Meeting link not available</Button>
                                    )}
                                    <RescheduleDialog bookingId={booking._id} />
                                    </div>
                                )}
                            </CardFooter>
                            </Card>
                        )
                    })}
                    </div>
                )}
            </div>
          </TabsContent>
          <TabsContent value="past">
             <div className="mt-6">
                {pastBookings.length === 0 ? (
                     <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="font-headline text-2xl font-semibold mb-2">No Past Classes</h2>
                        <p className="text-muted-foreground mb-4">You don't have any completed sessions.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pastBookings.map((booking) => {
                            const userRoleForBooking = userId === booking.studentId._id ? 'student' : 'tutor';
                            return (
                                <Card key={booking._id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="font-headline text-xl">{booking.subject}</CardTitle>
                                                <CardDescription>
                                                    {userRoleForBooking === 'student' ? `With ${booking.tutorId.name}` : `With ${booking.studentId.name}`}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="w-5 h-5" />
                                                <span className="capitalize font-medium text-foreground">Your Role: {userRoleForBooking}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-muted-foreground" />
                                            <span>{format(new Date(booking.sessionDate), "PPP")}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                            <span>{format(new Date(booking.sessionDate), "p")}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center bg-secondary/50 p-4">
                                        <span className="text-sm text-muted-foreground font-medium">Session Completed</span>
                                        {userRoleForBooking === 'student' && !booking.feedbackSubmitted && (
                                            <FeedbackForm
                                                bookingId={booking._id}
                                                tutorId={booking.tutorId._id}
                                                subject={booking.subject}
                                            />
                                        )}
                                        {userRoleForBooking === 'student' && booking.feedbackSubmitted && (
                                            <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5"><CheckCircle className="w-4 h-4"/> Feedback Submitted</span>
                                        )}
                                        {userRoleForBooking === 'tutor' && (
                                            <span className="text-sm text-muted-foreground">Awaiting student feedback</span>
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
             </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}

function MyClassesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="h-10 w-1/3 mx-auto mb-8" />
      <div className="w-full">
        <Skeleton className="h-10 w-1/2 mx-auto mb-6" />
        <div className="space-y-6 mt-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-48" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Since the page uses useSearchParams, it must be wrapped in a Suspense boundary
export default function MyClassesPage() {
    return (
        <Suspense fallback={<MyClassesSkeleton />}>
            <MyClassesContent />
        </Suspense>
    );
}
