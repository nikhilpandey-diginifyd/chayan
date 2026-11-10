"use client";

import * as m from "motion/react-m";
import { CalendarCheck, ClipboardList, Star, Video } from "lucide-react";

const steps = [
  { icon: CalendarCheck, label: "Booked" },
  { icon: Video, label: "Join the call" },
  { icon: ClipboardList, label: "Notes and next steps" },
  { icon: Star, label: "Review" },
] as const;

/**
 * Where this booking is in its life: booked, call open, notes, review.
 * The line fills up to the current step and the current step pulses.
 */
export function BookingTimeline({ current }: { current: number }) {
  return (
    <ol
      className="panel border-line bg-surface relative grid grid-cols-4 rounded-[var(--radius-panel)] border px-2 py-5 sm:px-6"
      aria-label="Session progress"
    >
      <div
        aria-hidden="true"
        className="bg-line absolute top-[2.6rem] right-[12.5%] left-[12.5%] h-1 rounded-full"
      />
      <m.div
        aria-hidden="true"
        className="from-saffron to-pen absolute top-[2.6rem] left-[12.5%] h-1 rounded-full bg-gradient-to-r"
        initial={{ width: 0 }}
        animate={{ width: `${(Math.min(current, steps.length - 1) / (steps.length - 1)) * 75}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
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
                done
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
              <step.icon aria-hidden="true" className="size-4" />
            </m.span>
            <span
              className={`mt-2 text-xs font-semibold sm:text-sm ${active ? "text-ink" : "text-ink-muted"}`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
