
import { Skeleton } from '@/components/ui/skeleton';

export function TutorSearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
      <div className="mb-8 p-6 bg-card rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center">
        <Skeleton className="h-10 flex-grow" />
        <Skeleton className="h-10 w-full md:w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
