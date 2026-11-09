import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton h-4", className)} />;
}

/** Announces loading to screen readers while the skeleton shows. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-line rounded-[var(--radius-card)] border bg-white p-5">
          <div className="flex gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2.5 pt-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-5 w-full" />
          <Skeleton className="mt-2 w-4/5" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 w-96 max-w-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
