import { ProfileForm } from "@/components/tutor-profile/ProfileForm";

export default function TutorProfilePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline text-4xl font-bold mb-2 text-center">Tutor Profile</h1>
        <p className="text-muted-foreground text-center mb-8">
          Create or update your profile to attract more students.
        </p>
        <ProfileForm />
      </div>
    </div>
  );
}
