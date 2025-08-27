
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from 'react';
import { resetPassword } from '@/app/reset-password/actions';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

const initialState = {
  success: false,
  message: null,
  errors: null,
};

export default function ResetPasswordPage() {
    const [state, formAction, isPending] = useActionState(resetPassword, initialState);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success!',
                description: state.message,
            });
            router.push('/login');
        } else if (state.message) {
            toast({
                title: 'Error',
                description: state.message,
                variant: 'destructive',
            });
        }
    }, [state, toast, router]);
    
    return (
        <div className="flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md">
                <form action={formAction}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Reset Your Password</CardTitle>
                        <CardDescription>
                           Enter the token from your email and your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">Reset Token</Label>
                            <Input 
                                id="token" 
                                name="token" 
                                type="text" 
                                placeholder="e.g., A1B2C3" 
                                required 
                                disabled={isPending}
                            />
                             {state.errors?.token && <p className="text-sm font-medium text-destructive">{state.errors.token[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                disabled={isPending}
                            />
                            {state.errors?.password && <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                type="password" 
                                required 
                                disabled={isPending}
                            />
                            {state.errors?.confirmPassword && <p className="text-sm font-medium text-destructive">{state.errors.confirmPassword[0]}</p>}
                        </div>
                         {state.message && !state.success && (
                            <div className="text-sm font-medium text-destructive flex items-center gap-1 bg-destructive/10 p-2 rounded-md">
                                <AlertCircle className="w-4 h-4" />
                                {state.message}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                        </Button>
                         <Link href="/login" className="text-sm text-primary hover:underline">
                            Back to Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
