
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from 'react';
import { requestPasswordReset } from '@/app/forgot-password/actions';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

const initialState = {
  success: false,
  message: null,
};

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.message) {
             toast({
                title: state.success ? 'Check Your Email' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
            if (state.success) {
                formRef.current?.reset();
            }
        }
    }, [state, toast]);
    
    return (
        <div className="flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md">
                <form ref={formRef} action={formAction}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Forgot Your Password?</CardTitle>
                        <CardDescription>
                            No problem. Enter your email address below and we'll send you a token to reset it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                placeholder="you@example.com" 
                                required 
                                disabled={isPending}
                            />
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
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Token"}
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
