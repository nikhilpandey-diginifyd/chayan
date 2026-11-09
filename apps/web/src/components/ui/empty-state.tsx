import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** What to show when a list has nothing in it yet: what this is, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-line/90 flex flex-col items-center rounded-[var(--radius-panel)] border border-dashed bg-white/60 px-6 py-12 text-center">
      <span className="bg-pen-soft text-pen grid size-12 place-items-center rounded-full">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="font-display mt-4 text-lg font-bold">{title}</p>
      {children ? <div className="text-ink-muted mt-1 max-w-md">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
