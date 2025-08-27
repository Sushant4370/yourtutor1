
import { Suspense } from 'react';
import { TutorListings } from '@/components/tutors/TutorListings';
import { TutorSearchSkeleton } from '@/components/tutors/TutorSearchSkeleton';
import type { Metadata } from 'next';
import { tutors as mockTutors } from '@/lib/data';
import { getTutors as getDatabaseTutors } from '@/lib/tutors';

export const metadata: Metadata = {
  title: 'Our Tutors',
  description: 'Browse our directory of expert tutors. Filter by subject to find the perfect match for your learning needs and book a session today.',
};

export default async function TutorsPage() {
    const databaseTutors = await getDatabaseTutors();
    
    // Get IDs from database tutors to filter out mock tutors with the same ID
    const databaseTutorIds = new Set(databaseTutors.map(t => t.id));
    const filteredMockTutors = mockTutors.filter(t => !databaseTutorIds.has(t.id));

    // Combine lists, with database tutors at the top
    const allTutors = [...databaseTutors, ...filteredMockTutors];

    return (
        <Suspense fallback={<TutorSearchSkeleton />}>
            <TutorListings tutors={allTutors} />
        </Suspense>
    )
}
