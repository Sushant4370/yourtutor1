
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Menu, BookOpenCheck, LogOut, User, Shield, LayoutDashboard, CalendarDays, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";


function useUnreadMessages() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (status !== 'authenticated') {
            setUnreadCount(0);
            return;
        }
        
        // Don't poll on the messages page itself, as messages are marked read there.
        // This prevents the badge from reappearing while the user is actively messaging.
        if (pathname.startsWith('/messages')) {
            setUnreadCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/api/messages/unread-count');
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch unread message count", error);
            }
        };

        fetchUnreadCount(); // Fetch immediately on load/route change
        const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15 seconds

        return () => clearInterval(interval);
    }, [status, pathname]);
    
    return unreadCount;
}

function NavLinks() {
    const { data: session, status } = useSession();
    const unreadCount = useUnreadMessages();

    const defaultRoutes = [
        { href: "/", label: "Home" },
        { href: "/tutors", label: "Find a Tutor" },
    ];
    
    if (status === 'loading') {
        return (
            <>
                {defaultRoutes.map(route => <Skeleton key={route.href} className="h-5 w-24" />)}
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
            </>
        )
    }
    
    if (status === 'unauthenticated') {
        return (
            <>
                {defaultRoutes.map(route => (
                    <Link key={route.href} href={route.href} className="transition-colors hover:text-primary">{route.label}</Link>
                ))}
                 <Link href="/tutor-profile" className="transition-colors hover:text-primary">Teach on YourTutor</Link>
            </>
        )
    }

    if (session?.user) {
        return (
            <>
                {defaultRoutes.map(route => (
                    <Link key={route.href} href={route.href} className="transition-colors hover:text-primary">{route.label}</Link>
                ))}
                <Link href="/my-classes" className="transition-colors hover:text-primary">My Classes</Link>
                
                {session.user.role === 'tutor' ? (
                     <Link href="/profile" className="transition-colors hover:text-primary flex items-center gap-1">
                        <LayoutDashboard className="h-4 w-4" /> Tutor Dashboard
                     </Link>
                ) : (
                    <Link href="/tutor-profile" className="transition-colors hover:text-primary">Teach on YourTutor</Link>
                )}

                 <Link href="/messages" className="transition-colors hover:text-primary relative flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> Messages
                    {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>}
                 </Link>

                {session.user.isAdmin && (
                    <Link href="/admin/tutors" className="font-semibold text-primary transition-colors hover:text-primary/80 flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Admin
                    </Link>
                )}
            </>
        );
    }
    
    return null;
}

function MobileNavLinks({ closeSheet }: { closeSheet: () => void }) {
    const { data: session, status } = useSession();
    const unreadCount = useUnreadMessages();

     const defaultRoutes = [
        { href: "/", label: "Home" },
        { href: "/tutors", label: "Find a Tutor" },
    ];

    if (status === 'loading') return null;

    const handleLinkClick = (href: string) => {
        closeSheet();
    };

    if (status === 'unauthenticated') {
        return (
            <>
                {defaultRoutes.map(route => (
                    <Link key={route.href} href={route.href} onClick={() => handleLinkClick(route.href)} className="text-lg">{route.label}</Link>
                ))}
                 <Link href="/tutor-profile" onClick={() => handleLinkClick('/tutor-profile')} className="text-lg">Teach on YourTutor</Link>
            </>
        )
    }
    
    if (session?.user) {
         return (
             <>
                {defaultRoutes.map(route => (
                    <Link key={route.href} href={route.href} onClick={() => handleLinkClick(route.href)} className="text-lg">{route.label}</Link>
                ))}
                 <Link href="/my-classes" onClick={() => handleLinkClick('/my-classes')} className="text-lg">My Classes</Link>
                
                {session.user.role === 'tutor' ? (
                     <Link href="/profile" onClick={() => handleLinkClick('/profile')} className="text-lg flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" /> Tutor Dashboard
                     </Link>
                ) : (
                    <Link href="/tutor-profile" onClick={() => handleLinkClick('/tutor-profile')} className="text-lg">Teach on YourTutor</Link>
                )}

                {session.user.isAdmin && (
                    <Link href="/admin/tutors" className="text-lg flex items-center gap-2" onClick={() => handleLinkClick('/admin/tutors')}>
                       <Shield className="h-5 w-5" /> Admin
                    </Link>
                )}
             </>
         )
    }

    return null;
}


function UserNav() {
    const { data: session, status } = useSession();
    const unreadCount = useUnreadMessages();
    
    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };
    
    if (status === "loading") {
        return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    if (status === "unauthenticated") {
        return (
            <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90">
                    <Link href="/register">Sign Up</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ""} className="object-cover" />
                            <AvatarFallback>{session?.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {session?.user?.isAdmin && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/tutors">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Account</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/messages" className="relative">
                             <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Messages</span>
                            {unreadCount > 0 && <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>}
                        </Link>
                    </DropdownMenuItem>
                    {session?.user?.role === 'tutor' && session?.user?.tutorStatus === 'approved' && (
                        <DropdownMenuItem asChild>
                            <Link href="/tutor/availability">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                <span>Manage Availability</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const unreadCount = useUnreadMessages();

  const handleSignOut = () => {
    if(isOpen) setIsOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-headline text-lg font-bold text-primary">
          <BookOpenCheck className="h-6 w-6" />
          <span>YourTutor</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLinks />
        </nav>

        <UserNav />

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">A panel with navigation links for mobile devices.</SheetDescription>
            <div className="flex h-full flex-col gap-6">
              <Link href="/" className="flex items-center gap-2 font-headline text-lg font-bold text-primary" onClick={() => setIsOpen(false)}>
                <BookOpenCheck className="h-6 w-6" />
                <span>YourTutor</span>
              </Link>
              <nav className="flex flex-col gap-4">
                <MobileNavLinks closeSheet={() => setIsOpen(false)} />
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                {status === "authenticated" ? (
                     <>
                        <Button variant="outline" asChild>
                          <Link href="/profile" onClick={() => setIsOpen(false)}>My Account</Link>
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href="/messages" onClick={() => setIsOpen(false)} className="relative w-full">
                                Messages
                                {unreadCount > 0 && <Badge variant="destructive" className="absolute top-1 right-2">{unreadCount}</Badge>}
                            </Link>
                        </Button>
                        
                        

                    
                    <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>Logout </Button>

                     </>
                ) : (
                    <>
                        <Button variant="outline" asChild>
                          <Link href="/login" onClick={() => setIsOpen(false)}>Log In</Link>
                        </Button>
                        <Button asChild className="bg-accent hover:bg-accent/90">
                          <Link href="/register" onClick={() => setIsOpen(false)}>Sign Up</Link>
                        </Button>
                    </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

    