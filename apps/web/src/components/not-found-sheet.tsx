"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

const options = [
  { letter: "A", text: "The link is old", reply: "Possible. Links do expire." },
  { letter: "B", text: "There's a typo in the address", reply: "Happens to the best of us." },
  { letter: "C", text: "The page moved", reply: "It might have. Try the home page." },
  { letter: "D", text: "All of the above", reply: "Correct! Full marks. Now let's get you back." },
];

/** A playful answer-sheet question for the "page not found" screen. */
export function NotFoundSheet() {
  const [chosen, setChosen] = useState<string | null>(null);
  const current = options.find((option) => option.letter === chosen);
  return (
    <m.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="ruled-paper border-line w-full max-w-lg rounded-[var(--radius-feature)] border bg-white py-7 pr-6 pl-16 shadow-[var(--shadow-raised)] sm:pl-20"
    >
      <p className="text-omr text-sm font-semibold">Question 404</p>
      <p id="nf-question" className="font-display mt-1 text-2xl font-bold">
        Why can&apos;t you see this page?
      </p>
      <div role="group" aria-labelledby="nf-question" className="mt-5 space-y-2">
        {options.map((option) => {
          const isChosen = chosen === option.letter;
          return (
            <button
              key={option.letter}
              type="button"
              aria-pressed={isChosen}
              onClick={() => setChosen(option.letter)}
              className="hover:bg-pen-soft/60 flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors"
            >
              <span className="border-omr/60 text-omr relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold">
                <AnimatePresence>
                  {isChosen ? (
                    <m.span
                      className="bg-ink absolute inset-0.5 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 480, damping: 20 }}
                    />
                  ) : null}
                </AnimatePresence>
                <span className={isChosen ? "sr-only" : ""}>{option.letter}</span>
              </span>
              <span className={isChosen ? "text-ink font-semibold" : "text-ink-muted"}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 min-h-6" aria-live="polite">
        <AnimatePresence mode="wait">
          {current ? (
            <m.p
              key={current.letter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`text-sm font-semibold ${current.letter === "D" ? "text-seal" : "text-pen"}`}
            >
              {current.reply}
            </m.p>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/"
          className="bg-pen hover:bg-pen-dark inline-flex h-11 items-center rounded-[var(--radius-control)] px-5 font-bold text-white transition-colors"
        >
          Go to home page
        </Link>
        <Link
          href="/mentors"
          className="border-line hover:border-pen/40 inline-flex h-11 items-center rounded-[var(--radius-control)] border bg-white px-5 font-bold transition-colors"
        >
          Find a mentor
        </Link>
      </div>
    </m.div>
  );
}
