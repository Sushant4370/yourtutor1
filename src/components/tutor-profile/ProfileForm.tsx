
"use client";

import { useEffect, useState, ChangeEvent, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon, X, Plus, FileText, Upload, AlertCircle, Info, CheckCircle, Clock, ChevronsUpDown, Check, Monitor, MapPin, CalendarDays } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { IQualification } from "@/models/TutorProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { professions } from "@/lib/professions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { AvatarUpload } from "@/components/profile/AvatarUpload";


const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

// Zod schema for form validation
const availabilitySchema = z.object({
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format"),
});

const qualificationSchema = z.object({
    url: z.string().url(),
    publicId: z.string(),
    originalFilename: z.string(),
    fileType: z.string(),
    uploadedAt: z.date(),
});

const profileFormSchema = z.object({
  subjects: z.array(z.string()).min(1, { message: "Please select at least one subject." }),
  hourlyRate: z.coerce.number().min(1, { message: "Rate must be greater than 0." }),
  experience: z.coerce.number().min(0, { message: "Experience cannot be negative." }).optional(),
  bio: z.string().min(50, { message: "Bio must be at least 50 characters long." }).max(3000, { message: "Bio cannot exceed 3000 characters (approx. 500 words)." }),
  isOnline: z.boolean().default(false),
  isInPerson: z.boolean().default(false),
  availability: z.array(availabilitySchema).optional(),
  qualifications: z.array(qualificationSchema).max(MAX_FILES, `You can upload a maximum of ${MAX_FILES} documents.`).optional(),
}).refine(data => data.isOnline || data.isInPerson, {
    message: "Please select at least one tutoring method (Online or In-person).",
    path: ["isOnline"], // Assign error to a field for display
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type QualificationUploadState = {
    file?: File;
    isLoading: boolean;
    error?: string;
    qualification?: IQualification;
    previewUrl: string;
    isExisting: boolean;
};

type TutorStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

function StatusAlert({ status, rejectionReason }: { status: TutorStatus, rejectionReason?: string | null }) {
    if (status === 'unverified') {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Welcome, Future Tutor!</AlertTitle>
                <AlertDescription>
                    Complete and submit your profile below to start the verification process.
                </AlertDescription>
            </Alert>
        )
    }
    if (status === 'pending') {
        return (
            <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertTitle>Profile Under Review</AlertTitle>
                <AlertDescription>
                    Your profile has been submitted and is currently being reviewed by our team. We'll notify you via email once the review is complete (usually within 3-5 business days).
                </AlertDescription>
            </Alert>
        )
    }
    if (status === 'approved') {
        return (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Your Profile is Approved and Live!</AlertTitle>
                <AlertDescription>
                    Congratulations! Your profile is now visible to students. You can make changes and update it at any time.
                </AlertDescription>
            </Alert>
        )
    }
    if (status === 'rejected') {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required: Profile Needs Updates</AlertTitle>
                <AlertDescription>
                    Your profile submission requires changes before it can be approved.
                    {rejectionReason && <div className="mt-2 font-semibold">Reason: {rejectionReason}</div>}
                    <p className="mt-1">Please update your profile based on the feedback and resubmit for another review.</p>
                </AlertDescription>
            </Alert>
        )
    }
    return null;
}

export function ProfileForm() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [tutorStatus, setTutorStatus] = useState<TutorStatus>('unverified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [qualificationUploadStates, setQualificationUploadStates] = useState<QualificationUploadState[]>([]);

  // Local state for the new availability slot form
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      subjects: [], 
      hourlyRate: undefined, // Use undefined for better controlled/uncontrolled handling
      bio: "", 
      isOnline: false, 
      isInPerson: false, 
      availability: [], 
      qualifications: [],
      experience: undefined, // Use undefined for better controlled/uncontrolled handling
    },
  });

  const { fields: availabilityFields, append: appendAvailability, remove: removeAvailability } = useFieldArray({
    control: form.control, name: "availability"
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!session) return;
      setIsFetching(true);
      try {
        const response = await fetch('/api/tutor/profile');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch profile.');
        }

        const data = await response.json();

        // The API now returns the combined user and profile data.
        setTutorStatus(data.tutorStatus);
        setRejectionReason(data.rejectionReason);

        // Only populate form if a profile sub-document exists
        if (data.profile) {
            const { profile } = data;
            const parsedAvailability = profile.availability?.map((a: any) => ({ ...a, date: new Date(a.date) })) || [];
            const parsedQualifications = profile.qualifications?.map((q: any) => ({ ...q, uploadedAt: new Date(q.uploadedAt) })) || [];
            
            form.reset({
              subjects: profile.subjects || [],
              hourlyRate: profile.hourlyRate,
              experience: profile.experience,
              bio: profile.bio || "",
              isOnline: profile.isOnline || false,
              isInPerson: profile.isInPerson || false,
              availability: parsedAvailability,
              qualifications: parsedQualifications,
            });
            
            const existingQualificationStates = parsedQualifications.map((q: IQualification) => ({
                qualification: q,
                previewUrl: q.url,
                isLoading: false,
                isExisting: true,
            }));
            setQualificationUploadStates(existingQualificationStates);
        }
      } catch (error: any) {
        console.error("Failed to fetch tutor profile", error);
        toast({ title: "Error Reaching Server", description: "Could not load your profile data. Please try again later.", variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    }
    fetchProfile();
  }, [session, form, toast]);


  useEffect(() => {
    const currentQualifications = qualificationUploadStates
        .filter(state => state.qualification && !state.error)
        .map(state => state.qualification!);
    form.setValue('qualifications', currentQualifications, { shouldValidate: true });
  }, [qualificationUploadStates, form]);


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (qualificationUploadStates.length + files.length > MAX_FILES) {
      toast({ title: "Too Many Files", description: `You can upload a maximum of ${MAX_FILES} documents.`, variant: "destructive" });
      setFileInputKey(Date.now()); return;
    }

    const newUploadsInProgress = Array.from(files).map(file => ({
      file, isLoading: true, previewUrl: URL.createObjectURL(file), isExisting: false,
    }));
    
    setQualificationUploadStates(prev => [...prev, ...newUploadsInProgress]);
    setFileInputKey(Date.now());

    for (const upload of newUploadsInProgress) {
        if (upload.file.size > MAX_FILE_SIZE_BYTES) {
            setQualificationUploadStates(prev => prev.map(s => s.previewUrl === upload.previewUrl ? { ...s, isLoading: false, error: `File too large (max ${MAX_FILE_SIZE_MB}MB)` } : s));
            continue;
        }

        const formData = new FormData();
        formData.append('file', upload.file);
        
        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Upload failed');

            const newQualification = {
              ...result.qualification,
              uploadedAt: new Date(result.qualification.uploadedAt)
            };

            setQualificationUploadStates(prev => prev.map(s => s.previewUrl === upload.previewUrl ? { ...s, isLoading: false, qualification: newQualification } : s));
        } catch (err: any) {
            setQualificationUploadStates(prev => prev.map(s => s.previewUrl === upload.previewUrl ? { ...s, isLoading: false, error: err.message || 'Upload failed' } : s));
        }
    }
  };

  const removeQualification = (indexToRemove: number) => {
    const stateToRemove = qualificationUploadStates[indexToRemove];
    if (stateToRemove?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(stateToRemove.previewUrl);
    }
    setQualificationUploadStates(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleAddAvailability = () => {
    if (!newDate || !newStartTime || !newEndTime) {
        toast({ title: "Incomplete", description: "Please select a date, start time, and end time.", variant: "destructive"});
        return;
    }
    const result = availabilitySchema.safeParse({date: newDate, startTime: newStartTime, endTime: newEndTime});
    if (!result.success) {
        toast({ title: "Invalid Time Format", description: "Please use HH:MM format for times (e.g., 14:00).", variant: "destructive"});
        return;
    }
    appendAvailability(result.data);
    setNewDate(undefined); setNewStartTime(''); setNewEndTime('');
  };

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    
    const payload = { ...data };
    console.log("Submitting the following payload to the backend:", payload);

    try {
      const response = await fetch('/api/tutor/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'An error occurred.');

      toast({ title: "Success!", description: "Your profile has been submitted for review." });
      setTutorStatus(result.status);

    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const onFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Please Fix Errors",
      description: "Your form has errors that need to be corrected before submission. Check all fields for red error messages.",
      variant: "destructive",
    });
  };
  
  const isUploading = qualificationUploadStates.some(s => s.isLoading);
  const isFormDisabled = isSubmitting || isFetching || isUploading || tutorStatus === 'pending';
  const submitButtonText = tutorStatus === 'approved' || tutorStatus === 'rejected' ? 'Save & Resubmit for Review' : 'Submit for Review';

  if (isFetching) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div>
          <div className="flex justify-end"><Skeleton className="h-12 w-32" /></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-8">
        <StatusAlert status={tutorStatus} rejectionReason={rejectionReason} />
        
        <Card>
            <CardHeader><CardTitle>Your Public Profile</CardTitle><CardDescription>This information, including your photo, will be displayed on your public tutor profile once approved.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                 <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                        <div className="flex justify-center py-4">
                        <AvatarUpload />
                        </div>
                    </FormControl>
                    <FormDescription>
                        Upload a professional, friendly photo of yourself. This is separate from your qualification documents.
                    </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects / Professions</FormLabel>
                        <FormControl>
                            <MultiSelect a11y={{
                                input: 'subjects-input',
                                list: 'subjects-list',
                            }}
                            options={professions}
                            selected={field.value}
                            onChange={(newSelection) => field.onChange(newSelection)}
                            placeholder="Select subjects you teach..."
                            disabled={isFormDisabled}
                        />
                        </FormControl>
                      <FormDescription>
                        Select all subjects you are qualified to teach.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="hourlyRate" render={({ field }) => (<FormItem><FormLabel>Tuition per hour ($)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} value={field.value ?? ''} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="experience" render={({ field }) => (<FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Introduction / Bio</FormLabel>
                        <FormControl>
                            <Textarea 
                                rows={12} 
                                maxLength={3000} 
                                placeholder="Describe your experience, teaching philosophy, and what makes you a great tutor..." 
                                {...field} 
                                disabled={isFormDisabled} />
                        </FormControl>
                        <FormDescription>
                            Tell students about your teaching style. Aim for around 500 words to give them a good sense of who you are.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormItem>
                    <FormLabel>Tutoring Method</FormLabel>
                    <FormDescription>Where will you conduct your tutoring sessions?</FormDescription>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="isOnline"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg flex-1 has-[:checked]:bg-secondary/50">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isFormDisabled}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Monitor className="w-5 h-5"/> Online
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isInPerson"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg flex-1 has-[:checked]:bg-secondary/50">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isFormDisabled}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                        <MapPin className="w-5 h-5"/> In-person
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormMessage>{form.formState.errors.isOnline?.message}</FormMessage>
                </FormItem>

            </CardContent>
        </Card>

        {tutorStatus === 'approved' ? (
            <Card>
                <CardHeader>
                    <CardTitle>Your Availability</CardTitle>
                    <CardDescription>Update your weekly teaching schedule.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-secondary/50 rounded-lg text-center border">
                        <p className="text-sm text-muted-foreground mb-3">Your profile is approved! You can now manage your availability on a dedicated page without needing to resubmit your profile for review.</p>
                        <Button asChild variant="outline">
                            <Link href="/tutor/availability" className="flex items-center gap-2">
                               <CalendarDays className="w-4 h-4" /> Manage Availability
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader><CardTitle>Your Availability</CardTitle><CardDescription>Add specific dates and times you are available. This is required for your initial application.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {availabilityFields.map((field, index) => (
                           <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-secondary/50">
                                <span className="font-medium">{format(field.date, "PPP")}</span><span className="text-muted-foreground">{field.startTime} - {field.endTime}</span>
                                <Button type="button" variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeAvailability(index)} disabled={isFormDisabled}><X className="h-4 w-4" /></Button>
                           </div>
                        ))}
                        {availabilityFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No availability slots added yet.</p>}
                    </div>
                     <div className="flex flex-col sm:flex-row items-end gap-2 pt-4 border-t">
                        <div className="grid gap-1.5 w-full sm:w-auto"><Label>Date</Label>
                            <Popover><PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")} disabled={isFormDisabled}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />{newDate ? format(newDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} /></PopoverContent></Popover>
                        </div>
                        <div className="grid gap-1.5 w-full sm:w-36"><Label htmlFor="start-time">Start Time</Label>
                            <Select onValueChange={setNewStartTime} value={newStartTime} disabled={isFormDisabled}>
                                <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                                <SelectContent><Command><CommandInput placeholder="Filter..."/><CommandList>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</CommandList></Command></SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-1.5 w-full sm:w-36"><Label htmlFor="end-time">End Time</Label>
                            <Select onValueChange={setNewEndTime} value={newEndTime} disabled={isFormDisabled}>
                                <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
                                <SelectContent><Command><CommandInput placeholder="Filter..."/><CommandList>{timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</CommandList></Command></SelectContent>
                            </Select>
                        </div>
                        <Button type="button" onClick={handleAddAvailability} className="w-full sm:w-auto" disabled={isFormDisabled}><Plus className="mr-2 h-4 w-4" /> Add Slot</Button>
                     </div>
                </CardContent>
            </Card>
        )}


        <Card>
          <CardHeader><CardTitle>Qualifications & Credentials</CardTitle><CardDescription>Upload documents like certificates or diplomas (up to {MAX_FILES}). PDF, JPG, PNG supported.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-3">
                {qualificationUploadStates.map((state, index) => (
                    <div key={state.previewUrl} className="flex items-center gap-3 p-2 border rounded-md">
                        {state.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : state.error ? <AlertCircle className="h-5 w-5 text-destructive" /> : <FileText className="h-5 w-5 text-primary" />}
                        <div className="flex-1">
                            <p className="font-medium truncate text-sm">{state.qualification?.originalFilename || state.file?.name || 'Uploaded Document'}</p>
                            {state.isLoading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                            {state.error && <p className="text-xs text-destructive">{state.error}</p>}
                            {state.qualification && <p className="text-xs text-muted-foreground">Added on: {format(new Date(state.qualification.uploadedAt), "PPP")}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeQualification(index)} disabled={isFormDisabled}><X className="h-4 w-4" /></Button>
                    </div>
                ))}
                {qualificationUploadStates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>}
            </div>
            <div className="pt-4 border-t">
              <Input id="qualification-upload" type="file" className="hidden" key={fileInputKey} onChange={handleFileChange} accept="application/pdf,image/jpeg,image/png" multiple disabled={isFormDisabled || qualificationUploadStates.length >= MAX_FILES} />
              <Button type="button" variant="outline" onClick={() => document.getElementById('qualification-upload')?.click()} disabled={isFormDisabled || qualificationUploadStates.length >= MAX_FILES}><Upload className="mr-2 h-4 w-4" /> Add Document</Button>
               {form.formState.errors.qualifications && <FormMessage className="mt-2">{form.formState.errors.qualifications.message}</FormMessage>}
            </div>
          </CardContent>
        </Card>

        {tutorStatus !== 'pending' && (
          <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isFormDisabled} className="bg-primary hover:bg-primary/90">
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isUploading ? 'Processing files...' : (isSubmitting ? 'Submitting...' : submitButtonText)}
              </Button>
          </div>
        )}
      </form>
    </Form>
  );
}


// --- Multi-select Component ---
interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  a11y: {
    input: string;
    list: string;
  };
}

function MultiSelect({ options, selected, onChange, placeholder, disabled, a11y }: MultiSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Safeguard: Ensure `selected` is always an array.
  const safeSelected = Array.isArray(selected) ? selected : [];

  const handleSelect = (item: string) => {
    onChange([...safeSelected, item]);
    setInputValue('');
  };

  const handleDeselect = (item: string) => {
    onChange(safeSelected.filter((s) => s !== item));
  };

  const filteredOptions = options.filter(
    (option) =>
      !safeSelected.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={disabled}
            className={cn(
              'flex w-full min-h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'flex-wrap gap-2'
            )}
            aria-expanded={open}
            aria-controls={a11y.list}
            aria-haspopup="listbox"
          >
            <div className="flex flex-wrap gap-2">
              {safeSelected.length > 0 ? (
                safeSelected.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="pl-2 pr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeselect(item);
                    }}
                  >
                    {item}
                    <span className="ml-1 rounded-full p-0.5 hover:bg-destructive/80">
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            id={a11y.input}
            ref={inputRef}
            placeholder="Search subjects..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList id={a11y.list}>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
