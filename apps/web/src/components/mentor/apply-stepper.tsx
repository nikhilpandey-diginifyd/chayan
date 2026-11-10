"use client";

import * as m from "motion/react-m";
import { Check, FileText, Send, UserRound } from "lucide-react";

const steps = [
  { icon: UserRound, label: "Your details" },
  { icon: FileText, label: "Documents" },
  { icon: Send, label: "Review" },
] as const;

/** Three-step progress for the mentor application. */
export function ApplyStepper({ done }: { done: number }) {
  return (
    <ol
      className="panel border-line relative grid grid-cols-3 rounded-[var(--radius-panel)] border bg-white px-2 py-5 shadow-[var(--shadow-raised)] sm:px-6"
      aria-label="Application progress"
    >
      <div
        aria-hidden="true"
        className="bg-line absolute top-[2.6rem] right-[16.6%] left-[16.6%] h-1 rounded-full"
      />
      <m.div
        aria-hidden="true"
        className="from-saffron to-pen absolute top-[2.6rem] left-[16.6%] h-1 rounded-full bg-gradient-to-r"
        initial={{ width: 0 }}
        animate={{ width: `${(Math.min(done, 2) / 2) * 66.8}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      {steps.map((step, index) => {
        const complete = index < done;
        const active = index === done;
        return (
          <li
            key={step.label}
            className="relative flex flex-col items-center text-center"
            aria-current={active ? "step" : undefined}
          >
            <m.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1 + index * 0.12,
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
              className={`relative grid size-10 place-items-center rounded-full border-2 ${
                complete
                  ? "border-seal bg-seal text-white"
                  : active
                    ? "border-pen text-pen bg-white"
                    : "border-line text-ink-muted bg-white"
              }`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="border-pen absolute inset-0 animate-ping rounded-full border-2 opacity-40 motion-reduce:hidden"
                />
              ) : null}
              {complete ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <step.icon aria-hidden="true" className="size-4" />
              )}
            </m.span>
            <span
              className={`mt-2 text-xs font-semibold sm:text-sm ${active ? "text-ink" : "text-ink-muted"}`}
            >
              {step.label}
              {complete ? <span className="sr-only"> (done)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
