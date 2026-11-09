"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, RotateCw } from "lucide-react";

const problems = [
  {
    emoji: "📚",
    problem: "Itni saari books, kya padhun kya chhodun?",
    fix: "A mentor who cleared trims your booklist to what actually matters for your stage.",
  },
  {
    emoji: "📝",
    problem: "Answers likhta hun, par marks nahi aate",
    fix: "Share a photo of your answer copy and get line-by-line feedback on the call.",
  },
  {
    emoji: "⏰",
    problem: "Job ke saath padhai ka time nahi milta",
    fix: "Talk to mentors who cleared while working and get a timetable that fits your day.",
  },
  {
    emoji: "🎯",
    problem: "Optional subject choose nahi ho raha",
    fix: "Hear from people who scored well in each optional before you commit a year to it.",
  },
  {
    emoji: "😓",
    problem: "Prelims mein baar baar cut-off se peeche",
    fix: "Find where your marks are leaking and fix your test strategy with someone who crossed it.",
  },
  {
    emoji: "🧮",
    problem: "Quant aur reasoning mein time khatam",
    fix: "SSC selectees show you the shortcuts and the order they attempt questions in.",
  },
  {
    emoji: "🎤",
    problem: "Interview ke naam se darr lagta hai",
    fix: "Practise with interview-appeared candidates and get honest feedback on your DAF.",
  },
  {
    emoji: "🗣️",
    problem: "Hindi medium hun, guidance English mein milti hai",
    fix: "Pick a mentor who speaks your language: Hindi, English or Hinglish.",
  },
];

/**
 * "Does this happen to you?" Tap the problems that sound familiar; each card
 * flips to show how a session with someone who cleared the exam helps.
 */
export function ProblemCards() {
  const [flipped, setFlipped] = useState<number[]>([]);
  const toggle = (index: number) =>
    setFlipped((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((item, index) => {
          const isFlipped = flipped.includes(index);
          return (
            <m.li
              key={item.problem}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="[perspective:1000px]"
            >
              <button
                type="button"
                aria-pressed={isFlipped}
                onClick={() => toggle(index)}
                className="group relative block h-48 w-full text-left"
              >
                <m.span
                  className="relative block size-full [transform-style:preserve-3d]"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <span className="card-link border-line absolute inset-0 flex flex-col justify-between rounded-[var(--radius-card)] border bg-white p-5 [backface-visibility:hidden]">
                    <span className="text-4xl" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span className="font-display text-xl leading-snug font-bold">
                      {item.problem}
                    </span>
                    <span className="text-pen flex items-center gap-1 text-sm font-semibold">
                      <RotateCw
                        aria-hidden="true"
                        className="size-3.5 transition-transform duration-300 group-hover:rotate-90"
                      />
                      Mere saath bhi hota hai
                    </span>
                  </span>
                  <span className="from-pen absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between rounded-[var(--radius-card)] bg-gradient-to-br to-[#8f3804] p-5 text-white [backface-visibility:hidden]">
                    <span className="text-sm font-bold text-[#ffd9b8]">How a mentor helps</span>
                    <span className="text-[1.05rem] leading-snug font-semibold">{item.fix}</span>
                    <span className="text-sm text-white/80">Tap to flip back</span>
                  </span>
                </m.span>
              </button>
            </m.li>
          );
        })}
      </ul>

      <div className="mt-8 min-h-24" aria-live="polite">
        <AnimatePresence mode="wait">
          {flipped.length > 0 ? (
            <m.div
              key="cta"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-ink flex flex-col items-start justify-between gap-4 rounded-[var(--radius-panel)] p-6 text-white sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-display text-2xl font-bold">
                  {flipped.length} of {problems.length} sound familiar?
                </p>
                <p className="text-white/80">
                  You&apos;re not alone. Every mentor here went through the same.
                </p>
              </div>
              <Link
                href="/mentors"
                className="bg-saffron text-ink inline-flex h-12 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-5 font-bold transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Talk to someone who&apos;s been there
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </Link>
            </m.div>
          ) : (
            <m.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-ink-muted text-center"
            >
              Tap the ones that sound like you.
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
