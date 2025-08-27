
import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/my-classes/',
          '/profile/',
          '/tutor-profile/',
          '/tutor/availability/',
          '/messages/',
          '/login-redirect/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
