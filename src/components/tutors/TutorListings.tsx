
"use client";

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TutorCard } from '@/components/tutors/TutorCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tutor } from '@/lib/types';

interface TutorListingsProps {
  tutors: Tutor[];
}

export function TutorListings({ tutors: allTutors }: TutorListingsProps) {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'All';
  const initialSearchTerm = searchParams.get('q') || '';

  const [subjectFilter, setSubjectFilter] = useState(initialSubject);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState('rating');

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    allTutors.forEach(tutor => {
      tutor.subjects.forEach(subject => subjects.add(subject));
    });
    return ['All', ...Array.from(subjects).sort()];
  }, [allTutors]);

  const sortedAndFilteredTutors = useMemo(() => {
    let filtered = allTutors.filter(tutor => {
      const subjectMatch = subjectFilter === 'All' || tutor.subjects.includes(subjectFilter);
      const searchTermMatch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tutor.headline.toLowerCase().includes(searchTerm.toLowerCase());
      return subjectMatch && searchTermMatch;
    });

    return filtered.sort((a, b) => {
        switch (sortBy) {
            case 'rating':
                return (b.rating ?? 0) - (a.rating ?? 0);
            case 'reviews':
                return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            default:
                return 0;
        }
    });

  }, [subjectFilter, searchTerm, allTutors, sortBy]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-4xl font-bold mb-8 text-center">Find Your Tutor</h1>
      
      <div className="mb-8 p-6 bg-card rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Search by name or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="w-full md:w-64">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-64">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedAndFilteredTutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedAndFilteredTutors.map(tutor => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="font-headline text-2xl font-semibold mb-2">No Tutors Found</h2>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
