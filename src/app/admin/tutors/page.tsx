
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { IUser } from '@/models/User';
import { format } from 'date-fns';
import { TutorAdminControls } from '@/components/admin/TutorAdminControls';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const statusStyles = {
  unverified: { text: "Unverified", variant: "outline", icon: ShieldAlert },
  pending: { text: "Pending", variant: "secondary", icon: ShieldAlert },
  approved: { text: "Approved", variant: "default", icon: ShieldCheck },
  rejected: { text: "Rejected", variant: "destructive", icon: ShieldX },
} as const;


function StatusBadge({ status }: { status: IUser['tutorStatus'] }) {
    const style = statusStyles[status] || statusStyles.unverified;
    const Icon = style.icon;
    return (
        <Badge variant={style.variant} className="capitalize">
             <Icon className="w-3.5 h-3.5 mr-1.5" />
            {style.text}
        </Badge>
    );
}

export default async function AdminTutorsListPage({ searchParams }: { searchParams?: { q?: string; status?: string; sortBy?: string; } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect('/login');
  }

  await dbConnect();

  const query = searchParams?.q || '';
  const status = searchParams?.status || 'all';
  const sortBy = searchParams?.sortBy || 'newest';

  const mongoFilter: mongoose.FilterQuery<IUser> = {};
  
  // Set the status filter based on the user's selection
  if (status && status !== 'all') {
    mongoFilter.tutorStatus = status as IUser['tutorStatus'];
  } else {
    // By default, only show users who have started the application process
    mongoFilter.tutorStatus = { $ne: 'unverified' };
  }

  // Add the search term filter if it exists
  if (query) {
    mongoFilter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ];
  }

  const sortOptions: { [key: string]: mongoose.SortOrder } = {};
  if (sortBy === 'oldest') {
      sortOptions.createdAt = 1; // Ascending
  } else {
      sortOptions.createdAt = -1; // Descending (newest first)
  }

  const tutors = await UserModel.find(mongoFilter).sort(sortOptions).lean();

  return (
    <div className="bg-secondary/50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-headline text-4xl font-bold mb-8">Tutor Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tutor Applications</CardTitle>
            <CardDescription>Review, approve, or reject tutor applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <TutorAdminControls />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.length > 0 ? tutors.map((tutor) => (
                  <TableRow key={tutor._id.toString()}>
                    <TableCell className="font-medium">{tutor.name}</TableCell>
                    <TableCell>{tutor.email}</TableCell>
                    <TableCell>{format(new Date(tutor.createdAt as Date), "PPP")}</TableCell>
                    <TableCell>
                      <StatusBadge status={tutor.tutorStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/tutors/${tutor._id.toString()}`}>
                          Review Profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No matching tutor applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
