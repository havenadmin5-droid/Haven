import { EventSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function EventsLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Filter pills skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <EventSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
