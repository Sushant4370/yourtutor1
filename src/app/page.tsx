
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Music, Mic, Palette, History, Atom, Paintbrush, Clapperboard, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const subjects = [
  { name: "Piano", icon: Music, href: "/tutors?subject=Piano" },
  { name: "Singing", icon: Mic, href: "/tutors?subject=Singing" },
  { name: "Oil Painting", icon: Palette, href: "/tutors?subject=Oil+Painting" },
  { name: "History", icon: History, href: "/tutors?subject=History" },
  { name: "Mathematics", icon: Atom, href: "/tutors?subject=Mathematics" },
  { name: "Water Painting", icon: Paintbrush, href: "/tutors?subject=Water+Painting" },
  { name: "Violin", icon: Clapperboard, href: "/tutors?subject=Violin" },
  { name: "English", icon: BookOpen, href: "/tutors?subject=English" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-primary/10 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary mb-4">Find Your Perfect Tutor</h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8">
            Unlock your potential with expert tutors in any subject. Personalized one-on-one sessions tailored to your learning style.
          </p>
          <form action="/tutors" method="GET" className="flex max-w-xl mx-auto">
            <Input
              type="search"
              name="q"
              placeholder="Search by subject, name, or keyword..."
              className="rounded-r-none focus:ring-0 focus:ring-offset-0"
            />
            <Button type="submit" className="rounded-l-none bg-accent hover:bg-accent/90">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-bold text-center mb-12">Explore Top Subjects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link href={subject.href} key={subject.name} className="group">
                <Card className="text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-accent/20 transition-colors">
                       <subject.icon className="h-8 w-8 text-primary group-hover:text-accent-foreground" />
                    </div>
                    <h3 className="font-headline text-lg font-semibold">{subject.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Wanna be a Tutor?</h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Share your knowledge, set your own hours, and earn money on your terms. Join our community of passionate educators today!
            </p>
            <Button asChild variant="secondary" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/tutor-profile">Apply Now</Link>
            </Button>
          </div>
          <div className="hidden md:block">
            <Image
              src="https://images.unsplash.com/photo-1587691592099-24045742c181?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwcm9mZXNzb3J8ZW58MHx8fHwxNzUxMzMwMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="A tutor teaching a student online"
              width={600}
              height={400}
              className="w-full h-auto rounded-lg shadow-2xl"
              data-ai-hint="teaching online"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
