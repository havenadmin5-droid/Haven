import { ConversationSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-[var(--border-color)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)]">
          <Skeleton className="h-8 w-32 mb-3" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-2">
          {[...Array(8)].map((_, i) => (
            <ConversationSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-full mb-4" />
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
