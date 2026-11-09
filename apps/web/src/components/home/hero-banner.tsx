"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Video,
} from "lucide-react";

const problems = [
  "Prelims clear nahi ho raha?",
  "Optional kaunsa lu, samajh nahi aa raha?",
  "Job ke saath padhai kaise karun?",
  "Answer writing mein marks nahi aate?",
  "Quant mein time khatam ho jata hai?",
  "Interview ka darr lagta hai?",
];

const notes = [
  { text: "10 booklists, 0 clarity", rotate: -6, top: "2%", left: "0%" },
  { text: "Cut-off se 4 marks peeche", rotate: 5, top: "6%", left: "56%" },
  { text: "Job + prep = no time", rotate: -3, top: "80%", left: "-2%" },
  { text: "Kaunsa optional?", rotate: 6, top: "84%", left: "58%" },
];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The homepage banner. It names the problems aspirants actually have, one
 * after another, and shows each worry note getting "sorted" by a session.
 */
export function HeroBanner() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const lines = setInterval(() => setIndex((value) => (value + 1) % problems.length), 2600);
    const stamps = setInterval(
      () => setSolved((value) => (value >= notes.length ? 0 : value + 1)),
      1500,
    );
    return () => {
      clearInterval(lines);
      clearInterval(stamps);
    };
  }, [reduce]);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] text-white">
      {/* Saffron glow and floating answer-sheet bubbles */}
      <div
        aria-hidden="true"
        className="bg-saffron/40 absolute -top-40 -right-32 -z-10 size-[34rem] rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -left-24 -z-10 size-[28rem] rounded-full bg-[#ffb36b]/20 blur-3xl"
      />
      {!reduce
        ? [12, 28, 46, 70, 86].map((left, i) => (
            <m.span
              key={left}
              aria-hidden="true"
              className="absolute -z-10 rounded-full border-2 border-white/25"
              style={{
                left: `${left}%`,
                width: 14 + (i % 3) * 10,
                height: 14 + (i % 3) * 10,
                bottom: -40,
              }}
              animate={{ y: [0, -720], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 9 + i * 1.7,
                repeat: Infinity,
                delay: i * 1.3,
                ease: "linear",
              }}
            />
          ))
        : null}

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
            <BadgeCheck aria-hidden="true" className="size-4" />
            UPSC and SSC selected candidates, verified
          </p>
          <h1 className="mt-5 text-[2.7rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-7xl">
            Tayyari mein atak gaye ho?
          </h1>
          <div className="mt-4 h-9 overflow-hidden sm:h-10" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <m.p
                key={problems[index]}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -28, opacity: 0 }}
                transition={{ duration: 0.45, ease }}
                className="font-display text-2xl font-bold text-[#ffd9b8] sm:text-3xl"
              >
                {problems[index]}
              </m.p>
            </AnimatePresence>
          </div>
          <p className="mt-5 max-w-lg text-lg font-medium text-white sm:text-xl">
            Talk one-to-one with someone who has already cleared it. In Hindi, English or Hinglish,
            on a video call from your phone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/mentors"
              className="text-pen-dark inline-flex h-13 items-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-lg font-bold shadow-[0_12px_30px_-12px_rgb(0_0_0/0.45)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] motion-reduce:transition-none"
            >
              Find a mentor
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href="/mentor/apply"
              className="inline-flex h-13 items-center rounded-[var(--radius-control)] border-2 border-white/60 px-6 text-lg font-bold transition-colors hover:bg-white/10"
            >
              Become a mentor
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li className="flex items-center gap-1.5">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Full refund if your mentor doesn&apos;t join
            </li>
            <li className="flex items-center gap-1.5">
              <Video aria-hidden="true" className="size-4" />
              No app needed
            </li>
          </ul>
        </div>

        {/* Worry notes that get sorted, around a booked-session card */}
        <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[26rem]">
          {notes.map((note, i) => {
            const isSolved = reduce || i < solved;
            return (
              <m.div
                key={note.text}
                className="absolute z-10 w-44 sm:w-48"
                style={{ top: note.top, left: note.left }}
                initial={{ opacity: 0, scale: 0.8, rotate: note.rotate }}
                animate={
                  reduce
                    ? { opacity: 1, scale: 1, rotate: note.rotate }
                    : { opacity: 1, scale: 1, rotate: note.rotate, y: [0, -8, 0] }
                }
                transition={{
                  opacity: { delay: 0.3 + i * 0.15 },
                  scale: { delay: 0.3 + i * 0.15, type: "spring", stiffness: 260, damping: 18 },
                  y: { duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <div
                  className={`rounded-2xl p-3.5 text-sm font-semibold shadow-[0_16px_30px_-14px_rgb(0_0_0/0.5)] transition-colors duration-500 ${
                    isSolved ? "text-ink bg-white" : "bg-[#fff4c2] text-[#5b4300]"
                  }`}
                >
                  <span className={isSolved ? "text-ink-muted line-through" : ""}>{note.text}</span>
                  <AnimatePresence>
                    {isSolved ? (
                      <m.span
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-seal mt-1 flex items-center gap-1 overflow-hidden text-xs font-bold"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Sorted in a 30-min call
                      </m.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </m.div>
            );
          })}

          <m.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            className="text-ink absolute top-1/2 left-1/2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)] sm:w-64"
          >
            <div className="flex items-center gap-3">
              <span className="from-saffron to-pen grid size-11 place-items-center rounded-full bg-gradient-to-br text-white">
                <Video className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg leading-tight font-bold">Session booked</p>
                <p className="text-ink-muted text-xs">With a verified selectee</p>
              </div>
            </div>
            <div className="bg-paper mt-4 space-y-2 rounded-2xl p-3 text-sm">
              <p className="flex items-center gap-2">
                <CalendarCheck className="text-pen size-4" />
                Today, 7:30 PM · 30 min
              </p>
              <p className="flex items-center gap-2">
                <BadgeCheck className="text-seal size-4" />
                Result verified
              </p>
            </div>
            <m.div
              className="from-saffron to-pen mt-4 h-2 rounded-full bg-gradient-to-r"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.4, ease, delay: 0.8 }}
              style={{ originX: 0 }}
            />
            <p className="text-ink-muted mt-2 text-xs">Your plan for the next 90 days, sorted.</p>
          </m.div>
        </div>
      </div>

      {/* Wavy bottom edge into the page */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute inset-x-0 -bottom-px block h-8 w-full sm:h-12"
      >
        <path d="M0 60V30C240 0 480 0 720 22s480 38 720 8v30H0Z" fill="var(--color-paper)" />
      </svg>
    </section>
  );
}
