
'use server';

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { cloudinaryInstance, cloudinaryConfigError } from '@/lib/cloudinary';
import { IQualification } from '@/models/TutorProfile';

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    // Allow any authenticated user to upload for now, or restrict to tutors:
    // if (!token || token.role !== 'tutor') {
    if (!token) {
        return NextResponse.json({ message: 'Not authorized for upload' }, { status: 401 });
    }

    if (!cloudinaryInstance) {
        return NextResponse.json({ message: cloudinaryConfigError || 'Cloudinary is not configured.' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
        }
        
        // Determine the resource type based on the file's MIME type.
        // This ensures PDFs are treated as 'raw' files and images as 'image' files.
        const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';

        // Convert file to buffer to stream to Cloudinary
        const buffer = Buffer.from(await file.arrayBuffer());

        const qualification = await new Promise<IQualification>((resolve, reject) => {
            const uploadStream = cloudinaryInstance.uploader.upload_stream(
                {
                    resource_type: resourceType, // Use the determined resource type
                    folder: `qualifications/${token.id}`,
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new Error('Failed to upload file.'));
                    }
                    if (!result) {
                        return reject(new Error('Cloudinary did not return a result.'));
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        originalFilename: file.name,
                        fileType: result.format || file.type,
                        uploadedAt: new Date(result.created_at),
                    });
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ message: 'File uploaded successfully', qualification }, { status: 201 });

    } catch (error) {
        console.error('[API Upload] Error:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'An unexpected server error occurred during upload.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
