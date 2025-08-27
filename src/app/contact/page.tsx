
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Have a question or need support? Contact the YourTutor team. We are here to help you with any inquiries you may have.',
};


export default function ContactPage() {
  return (
    <div className="bg-secondary/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
            <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="font-headline text-4xl md:text-5xl font-bold">Get in Touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Have questions? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
            </p>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
            <ContactForm />
        </div>
      </div>
    </div>
  );
}
