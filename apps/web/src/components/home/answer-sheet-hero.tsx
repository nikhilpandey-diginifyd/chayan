"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";
import { BadgeCheck, RotateCcw } from "lucide-react";

type Letter = "A" | "B" | "C" | "D";

const options: { letter: Letter; text: string; feedback: string }[] = [
  {
    letter: "A",
    text: "A batch of 400 students and one teacher",
    feedback: "Nobody in a batch of 400 reads your answer copy.",
  },
  {
    letter: "B",
    text: "The comment section under a toppers' video",
    feedback: "Advice from strangers who don't know your situation.",
  },
  {
    letter: "C",
    text: "A friend of a friend who 'almost' cleared",
    feedback: "Almost isn't cleared. Try again.",
  },
  {
    letter: "D",
    text: "Someone who actually cleared the exam",
    feedback: "Correct. That's who you'll find on Chayan.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;
const burst = Array.from({ length: 10 }, (_, index) => (index / 10) * Math.PI * 2);

/**
 * The hero's answer sheet. Visitors can mark an answer themselves; if they
 * don't, D fills in on its own and the "verified" seal stamps on. The card
 * tilts gently towards the pointer on desktop.
 */
export function AnswerSheetHero() {
  const reduce = useReducedMotion();
  const [chosen, setChosen] = useState<Letter | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!touched.current) setChosen("D");
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [6, -6]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 18,
  });

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width - 0.5);
    pointerY.set((event.clientY - box.top) / box.height - 0.5);
  }
  function onPointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  function choose(letter: Letter) {
    touched.current = true;
    setChosen(letter);
  }

  const current = options.find((option) => option.letter === chosen);
  const correct = chosen === "D";

  return (
    <div className="relative mx-auto w-full max-w-md [perspective:1200px] lg:max-w-none">
      <div
        aria-hidden="true"
        className="bg-pen/15 absolute -inset-6 -z-10 rounded-[2.5rem] blur-3xl"
      />
      <m.div
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="ruled-paper border-line relative rounded-[var(--radius-feature)] border bg-white py-7 pr-5 pl-[3.6rem] shadow-[var(--shadow-raised)] sm:py-9 sm:pr-9 sm:pl-20"
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-omr text-sm font-semibold">Question 1 · tap your answer</p>
          <p aria-hidden="true" className="text-ink-muted hidden text-xs sm:block">
            Roll no. 0 8 1 2 3 4 5
          </p>
        </div>
        <p id="hero-question" className="font-display mt-1 text-xl font-bold sm:text-2xl">
          Who should guide your preparation?
        </p>
        <div role="group" aria-labelledby="hero-question" className="mt-5 space-y-2">
          {options.map((option, index) => {
            const isChosen = chosen === option.letter;
            const wrong = isChosen && option.letter !== "D";
            return (
              <m.button
                type="button"
                key={option.letter}
                aria-pressed={isChosen}
                onClick={() => choose(option.letter)}
                initial={{ opacity: 0, x: -12 }}
                animate={wrong ? { opacity: 1, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, x: 0 }}
                transition={
                  wrong ? { duration: 0.4 } : { duration: 0.45, ease, delay: 0.3 + index * 0.08 }
                }
                className="hover:bg-pen-soft/50 flex w-full items-center gap-3.5 rounded-xl px-2 py-1.5 text-left transition-colors sm:gap-4"
              >
                <span
                  className={`relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    isChosen ? (wrong ? "border-omr" : "border-ink") : "border-omr/60 text-omr"
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {isChosen ? (
                      <m.span
                        key="fill"
                        className={`absolute inset-0.5 rounded-full ${wrong ? "bg-omr" : "bg-ink"}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 480, damping: 20 }}
                      />
                    ) : null}
                  </AnimatePresence>
                  <span className={isChosen ? "sr-only" : ""}>{option.letter}</span>
                  {isChosen && !wrong && !reduce
                    ? burst.map((angle) => (
                        <m.span
                          key={angle}
                          aria-hidden="true"
                          className="bg-omr absolute size-1.5 rounded-full"
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * 30,
                            y: Math.sin(angle) * 30,
                            opacity: 0,
                            scale: 0.4,
                          }}
                          transition={{ duration: 0.65, ease: "easeOut" }}
                        />
                      ))
                    : null}
                </span>
                <span className={isChosen && !wrong ? "text-ink font-semibold" : "text-ink-muted"}>
                  {option.text}
                </span>
              </m.button>
            );
          })}
        </div>
        <div className="mt-4 flex min-h-7 items-center justify-between gap-3" aria-live="polite">
          <AnimatePresence mode="wait">
            {current ? (
              <m.p
                key={current.letter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`text-sm font-semibold ${correct ? "text-seal" : "text-omr"}`}
              >
                {current.feedback}
              </m.p>
            ) : null}
          </AnimatePresence>
          {chosen ? (
            <button
              type="button"
              onClick={() => {
                touched.current = true;
                setChosen(null);
              }}
              className="text-ink-muted hover:text-ink flex shrink-0 items-center gap-1 text-xs"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      </m.div>

      <AnimatePresence>
        {correct ? (
          <m.div
            key="seal"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.7, rotate: -28 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 280, damping: 15, delay: 0.25 }}
            className="border-seal text-seal pointer-events-none absolute -right-1 -bottom-12 grid size-24 place-items-center rounded-full border-[3px] bg-white/90 shadow-[var(--shadow-card)] backdrop-blur sm:-right-5 sm:size-28"
          >
            <span className="border-seal/50 grid size-[82%] place-items-center rounded-full border border-dashed text-center">
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
        ) : null}
      </AnimatePresence>
    </div>
  );
}
