
import { Suspense } from 'react';
import { LoginForm, LoginSkeleton } from '@/components/auth/LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
