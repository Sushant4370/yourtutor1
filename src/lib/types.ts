
export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  subject?: string;
}

export interface AvailabilitySlot {
    date: string;
    startTime: string;
    endTime: string;
}

export interface Tutor {
  id: string;
  name: string;
  avatarUrl: string;
  headline: string;
  subjects: string[];
  rating?: number;
  reviewsCount?: number;
  hourlyRate: number;
  experience?: number;
  availabilitySummary?: string;
  availability: AvailabilitySlot[];
  isOnline?: boolean;
  isInPerson?: boolean;
  bio: string;
  aiSummary?: string;
  reviews?: Review[];
  updatedAt?: string;
  createdAt: string;
}
