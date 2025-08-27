
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';

import type { User as CustomUserType } from 'next-auth';


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<CustomUserType | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password.');
        }
        
        await dbConnect();
        const user = await UserModel.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          throw new Error('No user found with this email.');
        }

        if (!user.password) {
          throw new Error('This account was created using a different sign-in method.');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordCorrect) {
          throw new Error('Incorrect password.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
          isAdmin: user.isAdmin,
          role: user.role,
          tutorStatus: user.tutorStatus
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate the token with all necessary user data
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
        token.tutorStatus = user.tutorStatus;
        token.picture = user.image;
      }
      
      // If the session is updated (e.g., avatar change), update the token
      if (trigger === "update" && session?.image) {
        token.picture = session.image;
      }

      // Re-fetch from DB only when an admin makes a change, or when user re-authenticates
      // For now, we remove the on-every-request fetch to ensure stability.
      // A user will need to log out/in to see role changes.
      if (trigger === "signIn" || trigger === "signUp") {
          await dbConnect();
          const dbUser = await UserModel.findById(token.id);
          if (dbUser) {
              token.role = dbUser.role;
              token.isAdmin = dbUser.isAdmin;
              token.tutorStatus = dbUser.tutorStatus;
              token.picture = dbUser.avatar;
          }
      }

      return token;
    },
    async session({ session, token }) {
      // Pass all the data from the token to the session object
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.role = token.role as 'student' | 'tutor';
        session.user.tutorStatus = token.tutorStatus as 'unverified' | 'pending' | 'approved' | 'rejected';
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
