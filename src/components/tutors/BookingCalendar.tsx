
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isBefore } from "date-fns";
import type { Tutor } from "@/lib/types";
import { Loader2, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ContactTutorDialog } from "./ContactTutorDialog";
import { Separator } from "@/components/ui/separator";

interface BookingCalendarProps {
    tutor: Tutor;
}

export function BookingCalendar({ tutor }: BookingCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeZone, setTimeZone] = useState<string>('');
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // This effect runs only on the client, after hydration,
    // to prevent a server-client mismatch.
    setDate(new Date());
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Create a memoized map of available dates and their *future* time slots
  const availableDatesAndTimes = useMemo(() => {
    if (!tutor.availability) return new Map<string, string[]>();

    const now = new Date(); // Local time of the user's browser
    const availableSlots = new Map<string, string[]>();

    tutor.availability.forEach(slot => {
        // slot.date is an ISO string like '2024-08-01T00:00:00.000Z'
        const slotDate = parseISO(slot.date); // This creates a Date object in the browser's local timezone.
        
        // Create a new Date object representing the slot's date and time in the user's local timezone
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotDateTime = new Date(
            slotDate.getFullYear(),
            slotDate.getMonth(),
            slotDate.getDate(),
            hours,
            minutes
        );

        // Only consider slots that are in the future
        if (isBefore(now, slotDateTime)) {
            const dateString = format(slotDate, 'yyyy-MM-dd');
            if (!availableSlots.has(dateString)) {
                availableSlots.set(dateString, []);
            }
            availableSlots.get(dateString)!.push(slot.startTime);
        }
    });

    // Sort times for each day
    availableSlots.forEach((times) => times.sort((a, b) => a.localeCompare(b)));

    return availableSlots;
  }, [tutor.availability]);

  // The available date strings are the keys of our new map, representing days with future slots
  const availableDateStrings = useMemo(() => {
    return new Set(availableDatesAndTimes.keys());
  }, [availableDatesAndTimes]);

  const availableTimesForSelectedDate = useMemo(() => {
    if (!date) return [];
    const selectedDateString = format(date, 'yyyy-MM-dd');
    return availableDatesAndTimes.get(selectedDateString) || [];
  }, [date, availableDatesAndTimes]);
  
  // When the date changes, reset the selected time
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTime(null);
  }

  const handleBooking = async () => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/tutors/${tutor.id}`);
      return;
    }

    if (!date || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select an available date and time to book a session.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create a new Date object from the selected date. `date` is already local.
      const bookingDateTime = new Date(date);
      // Get hours and minutes from the selected time string "HH:MM"
      const [hours, minutes] = selectedTime.split(':').map(Number);
      // Set the time on the date object. setHours uses the browser's local timezone.
      bookingDateTime.setHours(hours, minutes, 0, 0);


      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          subject: tutor.subjects[0], // Using the first subject as a default
          sessionDateTime: bookingDateTime.toISOString(), // Send the full UTC ISO string
          startTime: selectedTime, // Send startTime for webhook logic
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session.");
      }

      // Redirect to Stripe checkout page
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error("Stripe session URL not found.");
      }

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const buttonText = status === 'unauthenticated' ? "Log In to Book" : "Book Now";
  
  // Render a loading state on the server and initial client render to avoid hydration mismatch
  if (!date) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex justify-between items-baseline">
                <span>Book a Session</span>
                <span className="text-primary">${tutor.hourlyRate}<span className="text-base font-normal text-muted-foreground">/hr</span></span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-64 border rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full bg-accent hover:bg-accent/90" size="lg" disabled={true}>
                    Loading Calendar...
                </Button>
            </CardFooter>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex justify-between items-baseline">
          <span>Book a Session</span>
          <span className="text-primary">${tutor.hourlyRate}<span className="text-base font-normal text-muted-foreground">/hr</span></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
            {status === 'authenticated' && session.user.id !== tutor.id && (
                <ContactTutorDialog tutor={tutor}>
                    <Button variant="outline" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message {tutor.name}
                    </Button>
                </ContactTutorDialog>
            )}
            {status === 'unauthenticated' && (
                <Button variant="outline" className="w-full" onClick={() => router.push(`/login?callbackUrl=/tutors/${tutor.id}`)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Log In to Message
                </Button>
            )}
        </div>
        <Separator className="mb-4" />
        <div>
          <h3 className="font-semibold mb-2">1. Select a Date</h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className="rounded-md border"
            disabled={(day) => {
                const dayString = format(day, 'yyyy-MM-dd');
                // Disable past dates and dates that don't have future availability slots.
                return day < new Date(new Date().setDate(new Date().getDate() - 1)) || !availableDateStrings.has(dayString) || isLoading;
            }}
             modifiers={{
                available: (day: Date) => availableDateStrings.has(format(day, 'yyyy-MM-dd'))
            }}
            modifiersStyles={{
                available: { fontWeight: 'bold', color: 'hsl(var(--primary))' }
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">2. Select an Available Time</h3>
           {timeZone && <p className="text-xs text-muted-foreground mb-2">Times are shown in your local timezone: {timeZone.replace(/_/g, ' ')}</p>}
          <div className="grid grid-cols-2 gap-2">
            {availableTimesForSelectedDate.length > 0 ? (
                availableTimesForSelectedDate.map((time) => (
                <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    disabled={isLoading}
                >
                    {time}
                </Button>
                ))
            ) : (
                <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                    No available time slots on this date.
                </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-accent hover:bg-accent/90" size="lg" onClick={handleBooking} disabled={isLoading || status === 'loading' || !selectedTime}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Redirecting..." : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
