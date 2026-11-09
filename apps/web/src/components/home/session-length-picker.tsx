"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Clock } from "lucide-react";
import { SESSION_PRICE_LIMITS } from "@chayan/shared";
import { cn } from "@/lib/utils";

const lengths = [
  {
    minutes: 15,
    title: "A quick check",
    fits: ["One focused doubt", "Is my booklist right?", "Should I take a drop year?"],
  },
  {
    minutes: 30,
    title: "The usual session",
    fits: [
      "Review two or three answers",
      "Build a monthly timetable",
      "Choose an optional subject",
    ],
  },
  {
    minutes: 60,
    title: "A deep dive",
    fits: [
      "Full mock interview with feedback",
      "Complete strategy reset",
      "Line-by-line answer copy review",
    ],
  },
];

/** Choose a session length to see what it's good for. */
export function SessionLengthPicker() {
  const [minutes, setMinutes] = useState(30);
  const selected = lengths.find((item) => item.minutes === minutes)!;

  return (
    <div className="panel border-line bg-surface rounded-[var(--radius-feature)] border p-6 sm:p-8">
      <div
        role="radiogroup"
        aria-label="Session length"
        className="bg-paper grid grid-cols-3 gap-1 rounded-2xl p-1"
      >
        {lengths.map((item) => {
          const active = item.minutes === minutes;
          return (
            <button
              key={item.minutes}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMinutes(item.minutes)}
              className={cn(
                "relative rounded-xl py-3 font-semibold transition-colors",
                active ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {active ? (
                <m.span
                  layoutId="length-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-white shadow-[var(--shadow-card)]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              ) : null}
              <span className="relative flex items-center justify-center gap-1.5">
                <Clock aria-hidden="true" className="size-4" />
                {item.minutes} min
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 min-h-44" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={selected.minutes}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="font-display text-2xl font-extrabold">{selected.title}</p>
            <ul className="mt-4 space-y-2.5">
              {selected.fits.map((fit, index) => (
                <m.li
                  key={fit}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * index + 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="border-ink grid size-5 place-items-center rounded-full border-2"
                  >
                    <span className="bg-ink size-2.5 rounded-full" />
                  </span>
                  {fit}
                </m.li>
              ))}
            </ul>
          </m.div>
        </AnimatePresence>
      </div>
      <p className="text-ink-muted border-line border-t pt-4 text-sm">
        Each mentor sets their own price, from ₹{SESSION_PRICE_LIMITS.minRupees} to ₹
        {SESSION_PRICE_LIMITS.maxRupees.toLocaleString("en-IN")}. You always see it before you pay.
      </p>
    </div>
  );
}
