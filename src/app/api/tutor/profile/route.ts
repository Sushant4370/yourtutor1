
'use server';

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/db';
import TutorProfileModel, { IQualification } from '@/models/TutorProfile';
import UserModel from '@/models/User';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { sendTutorApplicationEmails } from '@/lib/nodemailer';
import { generateTutorProfileSummary } from '@/ai/flows/generate-tutor-profile-summary';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = new mongoose.Types.ObjectId(token.id as string);

    // Use two direct queries instead of a complex aggregation for better resilience.
    const user = await UserModel.findById(userId).lean();
    if (!user) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const profile = await TutorProfileModel.findOne({ tutorId: userId }).lean();

    // Combine the data. The 'profile' field will be null if one doesn't exist.
    const combinedData = {
        ...user,
        profile: profile || null,
    };
    
    // Make sure to not send the password hash
    delete (combinedData as any).password;

    return NextResponse.json(combinedData, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching tutor profile data:', error);
    return NextResponse.json({ message: `An unexpected error occurred on the server: ${error.message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
  }
  
  const tutorId = new mongoose.Types.ObjectId(token.id as string);

  try {
    await dbConnect();
    const body = await req.json();

    const { bio, hourlyRate, subjects, availability, qualifications, isOnline, isInPerson, experience } = body;

    if (!bio || hourlyRate === undefined || !subjects) {
      return NextResponse.json({ message: 'Missing required profile fields.' }, { status: 400 });
    }

    // Generate AI summary
    let aiSummary = '';
    try {
        const summaryResult = await generateTutorProfileSummary({ profileDetails: bio });
        aiSummary = summaryResult.summary;
        console.log(`[API Tutor Profile] AI summary generated for tutor ${tutorId}.`);
    } catch (e) {
        console.error(`[API Tutor Profile] AI summary generation failed for tutor ${tutorId}:`, e);
        // We don't block profile submission if AI fails.
    }
    
    const profileData = {
      tutorId,
      bio,
      hourlyRate: Number(hourlyRate),
      subjects,
      experience: experience ? Number(experience) : undefined,
      availability: availability || [],
      qualifications: qualifications || [],
      aiSummary: aiSummary,
      isOnline: isOnline || false,
      isInPerson: isInPerson || false,
    };

    const updatedProfile = await TutorProfileModel.findOneAndUpdate(
      { tutorId: tutorId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    // Update user status to 'pending' but KEEP their current role.
    // The role will be changed to 'tutor' only upon admin approval.
    const user = await UserModel.findByIdAndUpdate(
        tutorId,
        { $set: { tutorStatus: 'pending', rejectionReason: undefined } },
        { new: true }
    );

    if (!user) {
        throw new Error('Could not find user to update status.');
    }
    
    console.log(`[API Tutor Profile] Successfully saved profile for user: ${tutorId} and set status to 'pending'. Role remains '${user.role}'.`);
    
    // Send notification emails
    const emailResult = await sendTutorApplicationEmails(user, updatedProfile);
    if (emailResult.success) {
      console.log(`[API Tutor Profile] Successfully queued notification emails for tutor application: ${tutorId}`);
    } else {
      console.warn(`[API Tutor Profile] Profile for ${tutorId} was saved, but notification emails FAILED to send. Error: ${emailResult.error}`);
    }

    return NextResponse.json({ 
        message: 'Profile submitted for review!', 
        profile: updatedProfile,
        status: user.tutorStatus,
    }, { status: 200 });

  } catch (error) {
    console.error(`[API Tutor Profile] Error updating profile for tutor ${tutorId}:`, error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
