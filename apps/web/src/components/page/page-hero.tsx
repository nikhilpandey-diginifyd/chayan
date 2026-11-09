"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The orange banner at the top of public pages, in the homepage's style:
 * deep saffron gradient, drifting answer-sheet bubbles, a wavy bottom edge,
 * and an optional line that cycles through relatable prompts.
 */
export function PageHero({
  icon,
  eyebrow,
  title,
  lines,
  description,
  children,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  lines?: string[];
  description?: ReactNode;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || !lines || lines.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % lines.length), 2800);
    return () => clearInterval(timer);
  }, [reduce, lines]);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] text-white">
      <div
        aria-hidden="true"
        className="bg-saffron/40 absolute -top-40 -right-24 -z-10 size-[28rem] rounded-full blur-3xl"
      />
      {!reduce
        ? [8, 30, 62, 84].map((left, i) => (
            <m.span
              key={left}
              aria-hidden="true"
              className="absolute -z-10 rounded-full border-2 border-white/25"
              style={{
                left: `${left}%`,
                width: 12 + (i % 3) * 9,
                height: 12 + (i % 3) * 9,
                bottom: -30,
              }}
              animate={{ y: [0, -420], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 8 + i * 1.6,
                repeat: Infinity,
                delay: i * 1.1,
                ease: "linear",
              }}
            />
          ))
        : null}

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-14 md:pb-24">
        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              {icon}
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold sm:text-6xl">{title}</h1>
          {lines && lines.length > 0 ? (
            <div className="mt-3 h-8 overflow-hidden sm:h-9" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <m.p
                  key={lines[index]}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="font-display text-xl font-bold text-[#ffd9b8] sm:text-2xl"
                >
                  {lines[index]}
                </m.p>
              </AnimatePresence>
            </div>
          ) : null}
          {description ? (
            <div className="mt-4 max-w-2xl text-lg font-medium text-white">{description}</div>
          ) : null}
        </m.div>
        {children ? (
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
            className="mt-7"
          >
            {children}
          </m.div>
        ) : null}
      </div>

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
