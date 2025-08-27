
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the dedicated team and mission behind YourTutor. We are committed to connecting learners with expert educators in a seamless, personalized environment.',
};

const teamMembers = [
  { name: 'Sushant Subedi', id: 's8069125', hint: 'person avatar' },
  { name: 'Pranish Shiwakoti', id: 's8069126', hint: 'person avatar' },
  { name: 'Sandesh Poudel', id: 's8088117', hint: 'person avatar' },
  { name: 'Mohan Gurung', id: 's8091840', hint: 'person avatar' },
];

export default function AboutUsPage() {
  return (
    <div className="bg-secondary/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        
        <div className="max-w-3xl mx-auto text-center mb-16">
            <Target className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="font-headline text-4xl md:text-5xl font-bold">About YourTutor</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                We are dedicated to bridging the gap between eager learners and expert educators. Our mission is to create a seamless, accessible, and personalized learning environment for everyone, everywhere.
            </p>
        </div>

        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <Users className="mx-auto h-12 w-12 text-primary mb-4" />
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Meet Our Team</h2>
                <p className="mt-2 text-md text-muted-foreground">The passionate individuals behind YourTutor.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member) => (
                    <Card key={member.id} className="text-center hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <h3 className="font-headline text-lg font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.id}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
