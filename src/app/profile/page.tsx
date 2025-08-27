
"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StudentProfile } from "@/components/profile/StudentProfile";
import { ProfileForm } from "@/components/tutor-profile/ProfileForm";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32 ml-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    // This should be handled by middleware, but as a fallback:
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>You must be logged in to view this page.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  // If user is in the tutor pipeline (applied, approved, or rejected), show the full profile form.
  // This form contains logic to display status alerts.
  if (session.user.tutorStatus !== 'unverified') {
     return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="font-headline text-4xl font-bold mb-2 text-center">Tutor Application & Profile</h1>
                <p className="text-muted-foreground text-center mb-8">
                    Manage your application status and public profile information.
                </p>
                <ProfileForm />
            </div>
        </div>
     );
  }
  
  // Otherwise, the user is a standard student who has not applied yet.
  // Show their simple account view with a CTA to apply.
  return <StudentProfile user={session.user} />;
}
