
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Monitor } from "lucide-react";
import type { Tutor } from "@/lib/types";

interface TutorCardProps {
  tutor: Tutor;
}

export function TutorCard({ tutor }: TutorCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Image
          src={tutor.avatarUrl}
          alt={`Avatar of ${tutor.name}`}
          width={80}
          height={80}
          className="rounded-full border-2 border-primary/20 object-cover"
          data-ai-hint="person avatar"
        />
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">
            <Link href={`/tutors/${tutor.id}`} className="hover:text-primary transition-colors">
              {tutor.name}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
             {tutor.rating && tutor.reviewsCount ? (
              <>
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>{tutor.rating.toFixed(1)} ({tutor.reviewsCount} reviews)</span>
              </>
            ) : <span className='text-xs'>No reviews yet</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3 h-10">
          {tutor.headline}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {tutor.subjects.map((subject) => (
            <Badge key={subject} variant="secondary" className="font-normal">{subject}</Badge>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
            <p className="font-bold text-lg text-primary">${tutor.hourlyRate}<span className="font-normal text-sm text-muted-foreground">/hr</span></p>
            {tutor.experience && <p>{tutor.experience} yrs exp</p>}
        </div>
         {tutor.availabilitySummary && (
            <div className="text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Availability:</p>
                <p>{tutor.availabilitySummary}</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-secondary/30 flex-col items-stretch gap-3">
         <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {tutor.isOnline && <span className="flex items-center gap-1"><Monitor className="w-4 h-4" /> Online</span>}
            {tutor.isInPerson && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> In-person</span>}
        </div>
        <Button asChild className="w-full bg-accent hover:bg-accent/90">
          <Link href={`/tutors/${tutor.id}`}>See More & Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
