"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const ease = [0.22, 1, 0.36, 1] as const;

/** Orange greeting banner for dashboards, with a rotating line and a slot on the right. */
export function DashboardHero({
  greeting,
  lines,
  chips,
  aside,
}: {
  greeting: string;
  lines: string[];
  chips?: string[];
  aside?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduce || lines.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % lines.length), 3200);
    return () => clearInterval(timer);
  }, [reduce, lines.length]);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] text-white">
      <div
        aria-hidden="true"
        className="bg-saffron/40 absolute -top-40 -right-24 -z-10 size-[30rem] rounded-full blur-3xl"
      />
      {!reduce
        ? [6, 24, 48, 72, 90].map((left, i) => (
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
              animate={{ y: [0, -460], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 8 + i * 1.5,
                repeat: Infinity,
                delay: i * 1.2,
                ease: "linear",
              }}
            />
          ))
        : null}
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-20 sm:px-6 md:pt-14 lg:grid-cols-[1.3fr_1fr] lg:pb-24">
        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <h1 className="text-4xl leading-tight font-extrabold sm:text-6xl">
            {greeting}{" "}
            <m.span
              aria-hidden="true"
              className="inline-block origin-[70%_70%]"
              animate={reduce ? undefined : { rotate: [0, 18, -8, 18, 0] }}
              transition={{ duration: 1.6, delay: 0.6, repeat: Infinity, repeatDelay: 4 }}
            >
              🙏
            </m.span>
          </h1>
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
          {chips && chips.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {chips.map((chip, i) => (
                <m.li
                  key={chip}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.2 + i * 0.07,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur"
                >
                  {chip}
                </m.li>
              ))}
            </ul>
          ) : null}
        </m.div>
        {aside ? (
          <m.div
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
          >
            {aside}
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
