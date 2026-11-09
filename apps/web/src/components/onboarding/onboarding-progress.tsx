"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { CheckCircle2, Sparkles } from "lucide-react";

/** Sticky "how much is left" meter for the onboarding form. */
export function OnboardingProgress({ done, total }: { done: number; total: number }) {
  const complete = done >= total;
  return (
    <div className="border-line/80 sticky top-16 z-20 -mx-4 border-b bg-[color-mix(in_oklab,var(--color-paper)_88%,transparent)] px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={complete ? "done" : "progress"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex items-center gap-1.5 ${complete ? "text-seal" : "text-ink"}`}
          >
            {complete ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <Sparkles aria-hidden="true" className="text-pen size-4" />
            )}
            {complete ? "All set. Ek click aur!" : "Your prep profile"}
          </m.span>
        </AnimatePresence>
        <span className="text-ink-muted" aria-live="polite">
          {done} of {total} done
        </span>
      </div>
      <div
        className="bg-line mt-2 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Profile completion"
      >
        <m.div
          className={`h-full rounded-full bg-gradient-to-r ${complete ? "from-seal to-[#2fbf86]" : "from-saffron to-pen"}`}
          animate={{ width: `${(done / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
    </div>
  );
}
