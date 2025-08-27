
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Sparkles, MessageSquare, Award } from "lucide-react";
import { BookingCalendar } from "@/components/tutors/BookingCalendar";
import { Separator } from "@/components/ui/separator";
import { tutors as mockTutors } from "@/lib/data";
import { getTutorById } from '@/lib/tutors';
import type { Tutor } from "@/lib/types";
import type { Metadata } from 'next';

async function getTutor(id: string): Promise<Tutor | null> {
    // First, try to get the tutor from the database
    const dbTutor = await getTutorById(id);
    if (dbTutor) {
        return dbTutor;
    }
    
    // If not in the database, fall back to mock data
    const mockTutor = mockTutors.find((tutor) => tutor.id === id);
    return mockTutor || null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tutor = await getTutor(params.id);
  if (!tutor) {
    return {
      title: "Tutor Not Found"
    }
  }

  const description = `Book a session with ${tutor.name}, an expert ${tutor.subjects.join(', ')} tutor. ${tutor.bio.substring(0, 120)}...`;

  return {
    title: `${tutor.name} | ${tutor.subjects[0]} Tutor`,
    description: description,
    openGraph: {
      title: `${tutor.name} | YourTutor`,
      description: `View ${tutor.name}'s profile and book a session on YourTutor.`,
      images: [
        {
          url: tutor.avatarUrl,
          width: 150,
          height: 150,
          alt: tutor.name,
        },
      ],
      type: 'profile',
      profile: {
        firstName: tutor.name.split(' ')[0],
        lastName: tutor.name.split(' ').slice(1).join(' '),
      },
      url: `/tutors/${tutor.id}`,
      siteName: 'YourTutor',
      modifiedTime: tutor.updatedAt,
    },
    twitter: {
        card: 'summary',
        title: `${tutor.name} | YourTutor`,
        description: description,
        images: [tutor.avatarUrl],
    }
  };
}


export default async function TutorProfilePage({ params }: { params: { id: string } }) {
  const tutor = await getTutor(params.id);

  if (!tutor) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tutor.name,
    image: tutor.avatarUrl,
    jobTitle: 'Tutor',
    description: tutor.bio,
    url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/tutors/${tutor.id}`,
    knowsAbout: tutor.subjects,
    ...(tutor.reviewsCount && tutor.reviewsCount > 0 && {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tutor.rating?.toFixed(1),
            reviewCount: tutor.reviewsCount,
        }
    }),
    ...(tutor.reviews && tutor.reviews.length > 0 && {
        review: tutor.reviews.map(review => ({
            '@type': 'Review',
            reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating.toString(),
                bestRating: '5',
            },
            author: {
                '@type': 'Person',
                name: review.author,
            },
            reviewBody: review.comment,
        }))
    })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Image
                      src={tutor.avatarUrl}
                      alt={`Profile of ${tutor.name}`}
                      width={150}
                      height={150}
                      className="rounded-full border-4 border-primary/20 mx-auto sm:mx-0 object-cover"
                      data-ai-hint="person avatar"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="font-headline text-3xl font-bold">{tutor.name}</h1>
                      <p className="text-muted-foreground mt-1">{tutor.headline}</p>
                      
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                            {tutor.rating && tutor.reviewsCount && tutor.reviewsCount > 0 ? (
                                <Link href="#reviews-section" className="group flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" aria-label={`Scroll to reviews for ${tutor.name}`}>
                                    <Star className="w-5 h-5 text-accent fill-accent" />
                                    <span className="font-semibold">{tutor.rating.toFixed(1)}</span>
                                    <span className="underline-offset-4 group-hover:underline">({tutor.reviewsCount} reviews)</span>
                                </Link>
                            ) : (
                                <p className="text-muted-foreground text-sm">No reviews yet</p>
                            )}

                             {tutor.experience !== undefined && tutor.experience > 0 && (
                                <>
                                    <span className="text-muted-foreground">·</span>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Award className="w-5 h-5" />
                                        <span className="font-semibold">{tutor.experience}</span>
                                        <span>{tutor.experience === 1 ? 'year exp.' : 'years exp.'}</span>
                                    </div>
                                </>
                             )}
                        </div>
                      
                      <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                        {tutor.subjects.map((subject) => (
                          <Badge key={subject} variant="default" className="bg-primary/80">{subject}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {tutor.aiSummary && (
                  <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                          <Sparkles className="w-6 h-6 text-accent" />
                          AI Generated Summary
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground italic">{tutor.aiSummary}</p>
                  </CardContent>
                  </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">{tutor.bio}</p>
                </CardContent>
              </Card>

              {tutor.reviews && tutor.reviews.length > 0 && (
                  <Card id="reviews-section">
                  <CardHeader>
                      <CardTitle className="font-headline text-2xl">Reviews ({tutor.reviewsCount})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {tutor.reviews.map((review, index) => (
                      <div key={review.id}>
                          <div className="flex items-start gap-4">
                              <MessageSquare className="w-5 h-5 mt-1 text-primary"/>
                              <div className="flex-1">
                                  <div className="flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                      <p className="font-semibold">{review.author}</p>
                                      <div className="flex items-center gap-1 text-sm">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                                      ))}
                                      </div>
                                  </div>
                                  {review.subject && <Badge variant="secondary" className="font-normal mt-1.5">{review.subject}</Badge>}
                                  <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                              </div>
                          </div>
                          {index < tutor.reviews.length - 1 && <Separator className="mt-6" />}
                      </div>
                      ))}
                  </CardContent>
                  </Card>
              )}

            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BookingCalendar tutor={tutor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
