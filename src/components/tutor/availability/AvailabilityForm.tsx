
'use client';

import { useState, useActionState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { updateAvailabilityAction } from '@/app/tutor/availability/actions';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, X, Plus } from 'lucide-react';
import { Command, CommandInput, CommandList } from '@/components/ui/command';

type AvailabilitySlot = {
    date: Date;
    startTime: string;
    endTime: string;
};

interface AvailabilityFormProps {
    initialAvailability: {
        date: string;
        startTime: string;
        endTime: string;
    }[];
}

const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();

const initialState = { success: false, message: null, error: null };

export function AvailabilityForm({ initialAvailability }: AvailabilityFormProps) {
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(updateAvailabilityAction, initialState);

    const [availability, setAvailability] = useState<AvailabilitySlot[]>(
        initialAvailability.map(a => ({...a, date: new Date(a.date)}))
    );

    const [newDate, setNewDate] = useState<Date | undefined>();
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');

    useEffect(() => {
        if (state.success && state.message) {
            toast({ title: "Success!", description: state.message });
        } else if (state.error) {
            toast({ title: "Error", description: state.error, variant: 'destructive' });
        }
    }, [state, toast]);

    const handleAddAvailability = () => {
        if (!newDate || !newStartTime || !newEndTime) {
            toast({ title: "Incomplete", description: "Please select a date, start time, and end time.", variant: "destructive"});
            return;
        }

        if (newStartTime >= newEndTime) {
            toast({
                title: "Invalid Time",
                description: "End time must be after the start time.",
                variant: "destructive"
            });
            return;
        }

        const isDuplicate = availability.some(slot =>
            format(slot.date, 'yyyy-MM-dd') === format(newDate, 'yyyy-MM-dd') &&
            slot.startTime === newStartTime
        );

        if (isDuplicate) {
            toast({
                title: "Duplicate Slot",
                description: "This time slot already exists for the selected date.",
                variant: "destructive"
            });
            return;
        }

        const newSlot = { date: newDate, startTime: newStartTime, endTime: newEndTime };
        setAvailability(prev => [...prev, newSlot].sort((a,b) => {
            const dateComparison = a.date.getTime() - b.date.getTime();
            if (dateComparison !== 0) return dateComparison;
            return a.startTime.localeCompare(b.startTime);
        }));
        setNewDate(undefined);
        setNewStartTime('');
        setNewEndTime('');
    };

    const removeAvailabilitySlot = (indexToRemove: number) => {
        setAvailability(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
         <Card>
            <form action={formAction}>
                 <input
                    type="hidden"
                    name="availability"
                    value={JSON.stringify(
                        availability.map(a => ({
                            ...a,
                            date: a.date.toISOString(),
                        }))
                    )}
                />
                <CardContent className="pt-6 space-y-4">
                     <div className="space-y-2">
                        {availability.map((field, index) => (
                           <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/50">
                                <span className="font-medium">{format(field.date, "PPP")}</span><span className="text-muted-foreground">{field.startTime} - {field.endTime}</span>
                                <Button type="button" variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeAvailabilitySlot(index)} disabled={isPending}><X className="h-4 w-4" /></Button>
                           </div>
                        ))}
                        {availability.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No availability slots added yet.</p>}
                    </div>
                     <div className="flex flex-col sm:flex-row items-end gap-2 pt-4 border-t">
                        <div className="grid gap-1.5 w-full sm:w-auto"><Label>Date</Label>
                            <Popover><PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")} disabled={isPending}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />{newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} /></PopoverContent></Popover>
                        </div>
                        <div className="grid gap-1.5 w-full sm:w-36"><Label htmlFor="start-time">Start Time</Label>
                            <Select onValueChange={setNewStartTime} value={newStartTime} disabled={isPending}>
                                <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                                <SelectContent><Command><CommandInput placeholder="Filter..."/><CommandList>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</CommandList></Command></SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-1.5 w-full sm:w-36"><Label htmlFor="end-time">End Time</Label>
                            <Select onValueChange={setNewEndTime} value={newEndTime} disabled={isPending}>
                                <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                                <SelectContent><Command><CommandInput placeholder="Filter..."/><CommandList>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</CommandList></Command></SelectContent>
                            </Select>
                        </div>
                        <Button type="button" onClick={handleAddAvailability} className="w-full sm:w-auto" disabled={isPending}><Plus className="mr-2 h-4 w-4" /> Add Slot</Button>
                     </div>
                     <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" disabled={isPending}>
                           {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isPending ? 'Saving...' : 'Save Availability'}
                        </Button>
                     </div>
                </CardContent>
            </form>
        </Card>
    );
}
