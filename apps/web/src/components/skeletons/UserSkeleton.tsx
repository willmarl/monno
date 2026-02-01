import { Skeleton } from "@/components/ui/skeleton";

export function UserSkeleton() {
  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
