
import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import type { IUser } from '@/models/User';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  // Define static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/tutors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
     {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
     {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ] as MetadataRoute.Sitemap;

  // Fetch dynamic tutor routes from the database
  try {
    await dbConnect();
    const tutors = await UserModel.find({ role: 'tutor', tutorStatus: 'approved' }).lean();
    
    const tutorRoutes = tutors.map((tutor: IUser) => ({
      url: `${baseUrl}/tutors/${tutor._id.toString()}`,
      lastModified: tutor.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...tutorRoutes];

  } catch (error) {
    console.error('Error generating sitemap:', error);
    // In case of an error, return only the static routes
    return staticRoutes;
  }
}
