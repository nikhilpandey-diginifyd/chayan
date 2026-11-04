import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {description ? <p className="text-ink-muted mt-2">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="text-ink-muted mt-6 text-center">{footer}</div> : null}
    </div>
  );
}
