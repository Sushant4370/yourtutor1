'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

function Redirector() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (status === 'loading') {
            return; // Wait for session to load
        }

        if (status === 'unauthenticated') {
            router.push('/login'); // Should not happen, but a fallback
            return;
        }

        if (session?.user) {
            const user = session.user;
            const callbackUrl = searchParams.get('callbackUrl');

            // Users with pending or rejected applications are always sent to their profile page to check status or make edits.
            if (user.tutorStatus === 'pending' || user.tutorStatus === 'rejected') {
                router.push('/tutor-profile');
            } else if (callbackUrl) {
                // If a callbackUrl exists (e.g., user was redirected to login), respect it.
                router.push(callbackUrl);
            } else {
                // Default redirect for all other logged-in users (students and approved tutors).
                router.push('/my-classes');
            }
        }
    }, [session, status, router, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50">
            <div className="space-y-4 p-8 rounded-lg shadow-lg bg-card w-full max-w-sm text-center">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <h1 className="text-2xl font-headline font-bold">Just a moment...</h1>
                <p className="text-muted-foreground">
                    We're securely logging you in and redirecting you to the right page.
                </p>
            </div>
        </div>
    );
}


export default function LoginRedirectPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Redirector />
        </Suspense>
    )
}
