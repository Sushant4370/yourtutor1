
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { User } from "next-auth";
import { ArrowRight, CalendarDays } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";

interface TutorProfileProps {
    user: User;
}

export function TutorProfile({ user }: TutorProfileProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
           <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl">My Account</CardTitle>
                <CardDescription>View and manage your account details.</CardDescription>
              </div>
              <Badge variant="default" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <AvatarUpload />
            {/* Basic Info Section */}
            <div className="space-y-4 border-t pt-8">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user.name || ""} readOnly disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user.email || ""} readOnly disabled />
                </div>
            </div>

            {/* Tutor Dashboard Section */}
            <Card className="bg-secondary/50 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Tutor Dashboard</CardTitle>
                  <CardDescription>Manage your public profile, availability, and bookings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <Link href="/tutor-profile" className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-accent/50 transition-colors">
                        <div>
                           <p className="font-semibold">Edit My Public Profile</p>
                           <p className="text-sm text-muted-foreground">Update your subjects, bio, and photo.</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                   </Link>
                   {user.tutorStatus === 'approved' && (
                       <Link href="/tutor/availability" className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-accent/50 transition-colors">
                            <div>
                               <p className="font-semibold">Manage Availability</p>
                               <p className="text-sm text-muted-foreground">Update your schedule without a full profile review.</p>
                            </div>
                           <CalendarDays className="w-5 h-5 text-muted-foreground" />
                       </Link>
                   )}
                    <Link href="/my-classes" className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-accent/50 transition-colors">
                        <div>
                           <p className="font-semibold">View My Schedule</p>
                           <p className="text-sm text-muted-foreground">See your upcoming classes and bookings.</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                   </Link>
                </CardContent>
              </Card>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
