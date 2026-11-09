"use client";

import * as m from "motion/react-m";
import { BadgeCheck } from "lucide-react";

const options = [
  { letter: "A", text: "A batch of 400 students and one teacher" },
  { letter: "B", text: "The comment section under a toppers' video" },
  { letter: "C", text: "A friend of a friend who 'almost' cleared" },
  { letter: "D", text: "Someone who actually cleared the exam" },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The page's one orchestrated moment: an OMR answer sheet where the options
 * appear, bubble D is filled in, and a "verified" seal is stamped on.
 * With reduced motion it simply appears in its final state.
 */
export function AnswerSheetHero() {
  return (
    <figure
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      aria-label="An exam-style question: who should guide your preparation? Option D, someone who actually cleared the exam, is marked and stamped verified."
    >
      <div
        aria-hidden="true"
        className="bg-pen/15 absolute -inset-6 -z-10 rounded-[2.5rem] blur-3xl"
      />
      <m.div
        initial={{ opacity: 0, y: 24, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.7, ease }}
        className="ruled-paper border-line relative overflow-hidden rounded-[var(--radius-feature)] border bg-white py-7 pr-6 pl-16 shadow-[var(--shadow-raised)] sm:py-9 sm:pr-9 sm:pl-20"
      >
        <div className="flex items-baseline justify-between gap-4" aria-hidden="true">
          <p className="text-omr text-sm font-semibold">Question 1</p>
          <p className="text-ink-muted text-xs">Roll no. 0 8 1 2 3 4 5</p>
        </div>
        <p className="font-display mt-1 text-xl font-bold sm:text-2xl" aria-hidden="true">
          Who should guide your preparation?
        </p>
        <ul className="mt-6 space-y-3.5" aria-hidden="true">
          {options.map((option, index) => {
            const chosen = option.letter === "D";
            return (
              <m.li
                key={option.letter}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.35 + index * 0.09 }}
                className="flex items-center gap-4"
              >
                <span
                  className={
                    chosen
                      ? "border-ink relative grid size-8 shrink-0 place-items-center rounded-full border-2"
                      : "border-omr/60 text-omr grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold"
                  }
                >
                  {chosen ? (
                    <m.span
                      className="bg-ink size-full rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18, delay: 1.05 }}
                    />
                  ) : (
                    option.letter
                  )}
                </span>
                <span className={chosen ? "text-ink font-semibold" : "text-ink-muted"}>
                  {option.text}
                </span>
              </m.li>
            );
          })}
        </ul>
      </m.div>

      <m.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.6, rotate: -24 }}
        animate={{ opacity: 1, scale: 1, rotate: -12 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 1.45 }}
        className="border-seal text-seal absolute -right-1 -bottom-14 grid size-24 place-items-center rounded-full border-[3px] bg-white/90 shadow-[var(--shadow-card)] backdrop-blur sm:-right-5 sm:-right-6 sm:size-28"
      >
        <span className="border-seal/50 grid size-[5.6rem] place-items-center rounded-full border border-dashed text-center">
          <span>
            <BadgeCheck className="mx-auto size-6" />
            <span className="mt-0.5 block text-[0.7rem] leading-tight font-semibold">
              Result
              <br />
              verified
            </span>
          </span>
        </span>
      </m.div>
    </figure>
  );
}
