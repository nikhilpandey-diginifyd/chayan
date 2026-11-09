"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, Check } from "lucide-react";
import { EXAMS, FOCUS_AREA_LABELS, type FocusArea } from "@chayan/shared";
import { cn } from "@/lib/utils";

const upscHelp: FocusArea[] = [
  "strategy",
  "answer_writing",
  "optional_subject",
  "interview_daf",
  "current_affairs",
  "hindi_medium",
];
const sscHelp: FocusArea[] = [
  "strategy",
  "quant",
  "reasoning",
  "english",
  "general_awareness",
  "working_professionals",
];

/** Pick an exam to see its stages and what its mentors help with. */
export function ExamExplorer() {
  const [code, setCode] = useState<string>(EXAMS[0]!.code);
  const exam = EXAMS.find((item) => item.code === code) ?? EXAMS[0]!;
  const help = exam.code === "UPSC_CSE" ? upscHelp : sscHelp;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Exams"
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {EXAMS.map((item) => {
          const active = item.code === code;
          return (
            <button
              key={item.code}
              type="button"
              role="tab"
              id={`exam-tab-${item.code}`}
              aria-selected={active}
              aria-controls="exam-panel"
              onClick={() => setCode(item.code)}
              className={cn(
                "relative shrink-0 rounded-full border px-4 py-2 font-semibold transition-colors",
                active
                  ? "border-pen text-white"
                  : "border-line text-ink-muted hover:text-ink bg-white",
              )}
            >
              {active ? (
                <m.span
                  layoutId="exam-explorer-pill"
                  aria-hidden="true"
                  className="bg-pen absolute inset-0 rounded-full shadow-[var(--shadow-pen)]"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              ) : null}
              <span className="relative">{item.shortName}</span>
            </button>
          );
        })}
      </div>

      <div
        id="exam-panel"
        role="tabpanel"
        aria-labelledby={`exam-tab-${exam.code}`}
        className="panel border-line bg-surface relative mt-6 overflow-hidden rounded-[var(--radius-feature)] border"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={exam.code}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.1fr_1fr]"
          >
            <div>
              <p className="text-ink-muted" lang="hi">
                {exam.nameHi}
              </p>
              <h3 className="mt-1 text-2xl font-extrabold sm:text-3xl">{exam.name}</h3>
              <p className="mt-6 text-sm font-semibold">
                The stages, and mentors who cleared each one
              </p>
              <ol className="mt-3 flex flex-wrap items-center gap-2">
                {exam.stages.map((stage, index) => (
                  <m.li
                    key={stage.code}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 * index + 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="bg-pen-soft text-pen-dark rounded-full px-3 py-1 text-sm font-semibold">
                      {index + 1}. {stage.name}
                    </span>
                    {index < exam.stages.length - 1 ? (
                      <span aria-hidden="true" className="bg-line h-px w-4" />
                    ) : null}
                  </m.li>
                ))}
              </ol>
              <Link
                href={`/mentors?exam=${exam.code}`}
                className="bg-ink hover:bg-pen-dark mt-8 inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] px-5 font-semibold text-white transition-[background-color,transform] active:scale-[0.97]"
              >
                See {exam.shortName} mentors
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </Link>
            </div>
            <div>
              <p className="text-sm font-semibold">What aspirants book sessions for</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {help.map((area, index) => (
                  <m.li
                    key={area}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index + 0.15 }}
                    className="border-line flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5"
                  >
                    <span className="bg-seal-soft text-seal grid size-6 shrink-0 place-items-center rounded-full">
                      <Check aria-hidden="true" className="size-3.5" />
                    </span>
                    {FOCUS_AREA_LABELS[area]}
                  </m.li>
                ))}
              </ul>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
