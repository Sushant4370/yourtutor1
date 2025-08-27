
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-headline text-lg font-bold text-primary">
              <BookOpenCheck className="h-6 w-6" />
              <span>YourTutor</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Connecting students and tutors for a better learning experience.
            </p>
          </div>
          <div>
            <h4 className="font-headline font-semibold mb-4">For Students</h4>
            <ul className="space-y-2">
              <li><Link href="/tutors" className="text-sm text-muted-foreground hover:text-primary">Find a Tutor</Link></li>
              <li><Link href="/register" className="text-sm text-muted-foreground hover:text-primary">Sign Up</Link></li>
              <li><Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline font-semibold mb-4">For Tutors</h4>
            <ul className="space-y-2">
              <li><Link href="/tutor-profile" className="text-sm text-muted-foreground hover:text-primary">Become a Tutor</Link></li>
              <li><Link href="/tutor-profile" className="text-sm text-muted-foreground hover:text-primary">Your Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about-us" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} YourTutor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
