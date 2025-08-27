import type { Metadata } from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/common/AuthProvider';
import { Chatbot } from '@/components/chatbot/Chatbot';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'YourTutor - Find The Perfect Tutor For You',
    template: '%s | YourTutor',
  },
  description: 'Unlock your potential with expert tutors in any subject. Personalized one-on-one sessions tailored to your learning style.',
  openGraph: {
    title: 'YourTutor - Find The Perfect Tutor For You',
    description: 'Unlock your potential with expert tutors in any subject.',
    url: APP_URL,
    siteName: 'YourTutor',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YourTutor - Find The Perfect Tutor For You',
    description: 'Unlock your potential with expert tutors in any subject.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <AuthProvider>
          <div className="relative flex min-h-dvh flex-col bg-background">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
          </div>
          <Chatbot />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
