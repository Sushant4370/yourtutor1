
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User } from "next-auth";
import { AvatarUpload } from "./AvatarUpload";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StudentProfileProps {
    user: User;
}

export function StudentProfile({ user }: StudentProfileProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl">My Account</CardTitle>
                <CardDescription>View and manage your account details.</CardDescription>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <AvatarUpload />
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
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Ready to Share Your Knowledge?</CardTitle>
                <CardDescription>Join our community of passionate educators and start earning on your own terms.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                    <Link href="/tutor-profile">
                        Become a Tutor
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
