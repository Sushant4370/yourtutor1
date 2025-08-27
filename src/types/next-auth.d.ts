
import type { DefaultSession, User as DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    isAdmin: boolean;
    role: 'student' | 'tutor';
    tutorStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  }

  interface Session extends DefaultSession {
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    isAdmin: boolean;
    role: 'student' | 'tutor';
    tutorStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  }
}
