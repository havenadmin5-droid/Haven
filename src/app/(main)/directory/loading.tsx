import { ProfileSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function DirectoryLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <ProfileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
