
import 'server-only';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import TutorProfileModel from '@/models/TutorProfile';
import FeedbackModel from '@/models/Feedback';
import type { Tutor, Review } from './types';
import { format } from 'date-fns';

async function getTutorData(tutorId: mongoose.Types.ObjectId | string) {
    const profile = await TutorProfileModel.findOne({ tutorId }).lean();
    if (!profile) return null;

    const feedback = await FeedbackModel.find({ tutorId }).lean();
    const reviewsCount = feedback.length;
    const totalRating = feedback.reduce((acc, f) => acc + f.rating, 0);
    const rating = reviewsCount > 0 ? totalRating / reviewsCount : undefined;

    const reviews: Review[] = feedback.map(f => ({
        id: f._id.toString(),
        author: 'Anonymous Student', // Or fetch student name if needed
        rating: f.rating,
        comment: f.comment || '',
        subject: f.subject,
    }));

    // Availability summary logic
    let availabilitySummary = 'No upcoming availability';
    if (profile.availability && profile.availability.length > 0) {
        const sortedAvailability = profile.availability
            .map(a => new Date(a.date))
            .filter(d => d >= new Date())
            .sort((a, b) => a.getTime() - b.getTime());

        if (sortedAvailability.length > 0) {
            availabilitySummary = `Available from ${format(sortedAvailability[0], 'MMM do')}`;
        }
    }


    return {
        profile,
        rating,
        reviewsCount,
        reviews,
        availabilitySummary
    };
}

export async function getTutors(): Promise<Tutor[]> {
    await dbConnect();

    const dbUsers = await UserModel.find({ role: 'tutor', tutorStatus: 'approved' }).lean();

    const tutors = await Promise.all(dbUsers.map(async (user) => {
        const tutorData = await getTutorData(user._id);
        if (!tutorData) return null;

        const { profile, rating, reviewsCount, reviews, availabilitySummary } = tutorData;
        
        return {
            id: user._id.toString(),
            name: user.name,
            avatarUrl: user.avatar || 'https://placehold.co/150x150.png',
            headline: profile.aiSummary || profile.bio.substring(0, 100) + '...', // Fallback headline
            subjects: profile.subjects,
            hourlyRate: profile.hourlyRate,
            experience: profile.experience,
            isOnline: profile.isOnline,
            isInPerson: profile.isInPerson,
            bio: profile.bio,
            aiSummary: profile.aiSummary,
            availability: profile.availability.map(a => ({
                date: a.date.toISOString(),
                startTime: a.startTime,
                endTime: a.endTime,
            })),
            availabilitySummary,
            rating,
            reviewsCount,
            reviews,
            createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        } as Tutor;
    }));

    return tutors.filter((t): t is Tutor => t !== null);
}

export async function getTutorById(id: string): Promise<Tutor | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    await dbConnect();
    const user = await UserModel.findById(id).lean();

    if (!user || user.role !== 'tutor' || user.tutorStatus !== 'approved') {
        return null;
    }

    const tutorData = await getTutorData(id);
    if (!tutorData) return null;
    
    const { profile, rating, reviewsCount, reviews, availabilitySummary } = tutorData;

    return {
        id: user._id.toString(),
        name: user.name,
        avatarUrl: user.avatar || 'https://placehold.co/150x150.png',
        headline: profile.aiSummary || profile.bio.substring(0, 100) + '...',
        subjects: profile.subjects,
        hourlyRate: profile.hourlyRate,
        experience: profile.experience,
        isOnline: profile.isOnline,
        isInPerson: profile.isInPerson,
        bio: profile.bio,
        aiSummary: profile.aiSummary,
        availability: profile.availability.map(a => ({
            date: a.date.toISOString(),
            startTime: a.startTime,
            endTime: a.endTime,
        })),
        availabilitySummary,
        rating,
        reviewsCount,
        reviews,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
}
