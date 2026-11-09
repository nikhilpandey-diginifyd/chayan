import type { ReactNode } from "react";
import { AuthAside, AuthCardMotion, AuthStrip } from "@/components/auth/auth-aside";

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
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1fr_28rem]">
      <AuthAside />
      <div className="w-full self-center">
        <AuthStrip />
        <AuthCardMotion>
          <div className="panel border-line bg-surface rounded-[var(--radius-panel)] border p-6 shadow-[var(--shadow-raised)] sm:p-8">
            <h1 className="text-3xl font-extrabold">{title}</h1>
            {description ? <p className="text-ink-muted mt-2">{description}</p> : null}
            <div className="mt-6">{children}</div>
          </div>
        </AuthCardMotion>
        {footer ? <div className="text-ink-muted mt-6 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}
