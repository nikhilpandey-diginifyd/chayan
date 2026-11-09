import { CardGridSkeleton, LoadingRegion, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-4 w-[28rem] max-w-full" />
        <Skeleton className="mt-8 h-20 w-full rounded-[var(--radius-panel)]" />
        <div className="mt-10">
          <CardGridSkeleton />
        </div>
      </div>
    </LoadingRegion>
  );
}
