import type { ReactNode } from "react";
import { BadgeCheck, Languages, ShieldCheck } from "lucide-react";

const promises = [
  { icon: BadgeCheck, text: "Every mentor's result is checked against the official list" },
  { icon: Languages, text: "Sessions in Hindi, English or Hinglish" },
  { icon: ShieldCheck, text: "Full refund if your mentor doesn't join" },
] as const;

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
    <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1fr_28rem]">
      <aside className="ruled-paper border-line relative hidden overflow-hidden rounded-[var(--radius-feature)] border p-10 pl-20 lg:block">
        <p className="font-display text-ink text-3xl leading-tight font-extrabold">
          Prepare with people who have already cleared the exam.
        </p>
        <ul className="mt-8 space-y-4">
          {promises.map((item) => (
            <li key={item.text} className="flex gap-3">
              <item.icon aria-hidden="true" className="text-seal mt-0.5 size-5 shrink-0" />
              <span className="text-ink-muted">{item.text}</span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="w-full">
        <div className="panel border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {description ? <p className="text-ink-muted mt-2">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="text-ink-muted mt-6 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}
