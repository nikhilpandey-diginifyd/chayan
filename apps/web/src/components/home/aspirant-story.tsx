"use client";

import { useRef, useState } from "react";
import { AnimatePresence, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";

const chapters = [
  {
    label: "Day 1",
    title: "Naya notebook, nayi energy.",
    text: "Twelve hours a day, pakka. Is baar to clear karke hi rahenge.",
    emoji: "🔥",
    mood: 92,
    tone: "#138a5e",
  },
  {
    label: "Month 4",
    title: "10 booklists. 5 channels. 3 test series.",
    text: "Sab kuch padh rahe ho, par pata nahi kya kaam ka hai aur kya nahi.",
    emoji: "😵‍💫",
    mood: 55,
    tone: "#e2a400",
  },
  {
    label: "Result day",
    title: "Cut-off se 4 marks peeche.",
    text: "Ghar walon ko kya bolun? Ab kahan se shuru karun?",
    emoji: "😞",
    mood: 18,
    tone: "#e23744",
  },
  {
    label: "With Chayan",
    title: "30 minutes with someone who cleared it.",
    text: "Pata chala galti kahan thi. Agle 90 din ka clear plan, aur wapas wahi energy.",
    emoji: "🚀",
    mood: 88,
    tone: "#c24e08",
  },
];

/**
 * Every aspirant's story, told as you scroll: the chapter on the left and
 * the mood meter on the right change with your scroll position.
 */
export function AspirantStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(chapters.length - 1, Math.max(0, Math.floor(value * chapters.length))));
  });
  const chapter = chapters[active]!;

  return (
    <div ref={ref} className="relative h-[320vh]">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-pen font-semibold">Har aspirant ki kahani</p>
            <div className="mt-4 flex gap-2" aria-hidden="true">
              {chapters.map((item, index) => (
                <span
                  key={item.label}
                  className="bg-line h-1.5 flex-1 overflow-hidden rounded-full"
                >
                  <m.span
                    className="block h-full rounded-full"
                    style={{ backgroundColor: item.tone }}
                    animate={{ width: index <= active ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </span>
              ))}
            </div>
            <div className="relative mt-8 min-h-64 sm:min-h-56">
              <AnimatePresence mode="wait">
                <m.div
                  key={chapter.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-display text-xl font-bold" style={{ color: chapter.tone }}>
                    {chapter.label}
                  </p>
                  <h2 className="mt-2 text-4xl leading-tight font-extrabold sm:text-5xl">
                    {chapter.title}
                  </h2>
                  <p className="text-ink-muted mt-4 max-w-md text-xl">{chapter.text}</p>
                </m.div>
              </AnimatePresence>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="panel border-line relative mx-auto w-full max-w-sm rounded-[var(--radius-feature)] border bg-white p-8 text-center"
          >
            <AnimatePresence mode="popLayout">
              <m.p
                key={chapter.emoji}
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="text-8xl"
              >
                {chapter.emoji}
              </m.p>
            </AnimatePresence>
            <p className="text-ink-muted mt-6 text-sm font-semibold">Josh meter</p>
            <div className="bg-paper mt-2 h-4 overflow-hidden rounded-full">
              <m.div
                className="h-full rounded-full"
                animate={{ width: `${chapter.mood}%`, backgroundColor: chapter.tone }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
            <m.p
              className="font-display mt-2 text-3xl font-extrabold"
              animate={{ color: chapter.tone }}
            >
              {chapter.mood}%
            </m.p>
          </div>
        </div>
        <m.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className="from-saffron to-pen absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r"
        />
      </div>
      {/* Readable without scrolling, for screen readers and search engines */}
      <ol className="sr-only">
        {chapters.map((item) => (
          <li key={item.label}>
            {item.label}: {item.title} {item.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
