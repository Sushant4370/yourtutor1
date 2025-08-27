
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TutorAdminControls() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleParamChange = (key: string, value: string, defaultValue: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== defaultValue) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        replace(`${pathname}?${params.toString()}`);
    };
    
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <Input
                placeholder="Search by name or email..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
                className="flex-grow"
            />
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="w-full sm:w-48">
                    <Select
                        onValueChange={(value) => handleParamChange('status', value, 'all')}
                        defaultValue={searchParams.get('status')?.toString() || 'all'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-48">
                    <Select
                        onValueChange={(value) => handleParamChange('sortBy', value, 'newest')}
                        defaultValue={searchParams.get('sortBy')?.toString() || 'newest'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
