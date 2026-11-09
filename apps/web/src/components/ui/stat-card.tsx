import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** One number on a dashboard, with what it means. */
export function StatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="panel border-line bg-surface relative overflow-hidden rounded-[var(--radius-card)] border p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="bg-pen-soft text-pen grid size-8 shrink-0 place-items-center rounded-lg">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <dt className="text-ink-muted text-sm">{label}</dt>
      </div>
      <dd className="mt-3 text-2xl font-bold tracking-tight">{children}</dd>
    </div>
  );
}
