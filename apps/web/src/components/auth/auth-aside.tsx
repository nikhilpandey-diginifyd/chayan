"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { BadgeCheck, CalendarCheck, Languages, ShieldCheck, Video } from "lucide-react";

const promises = [
  { icon: BadgeCheck, text: "Every mentor's result is checked against the official list" },
  { icon: Languages, text: "Sessions in Hindi, English or Hinglish" },
  { icon: ShieldCheck, text: "Full refund if your mentor doesn't join" },
] as const;

const lines = [
  "Akele tayyari mushkil hai.",
  "Sahi guidance, sahi time pe.",
  "Jo clear kar chuke, unse seekho.",
];

const ease = [0.22, 1, 0.36, 1] as const;

function Bubbles({ count, height }: { count: number; height: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <m.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full border-2 border-white/25"
          style={{
            left: `${8 + ((i * 23) % 84)}%`,
            width: 12 + (i % 3) * 9,
            height: 12 + (i % 3) * 9,
            bottom: -30,
          }}
          animate={{ y: [0, -height], opacity: [0, 0.9, 0] }}
          transition={{ duration: 7 + i * 1.4, repeat: Infinity, delay: i * 1.2, ease: "linear" }}
        />
      ))}
    </>
  );
}

/** Desktop side panel on sign-in, sign-up and password pages. */
export function AuthAside() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % lines.length), 3000);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <aside className="relative isolate hidden min-h-[34rem] overflow-hidden rounded-[var(--radius-feature)] bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] p-10 text-white lg:flex lg:flex-col">
      <div
        aria-hidden="true"
        className="bg-saffron/40 absolute -top-32 -right-24 -z-10 size-96 rounded-full blur-3xl"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Bubbles count={5} height={600} />
      </div>

      <div className="h-24 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={lines[index]}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className="font-display text-4xl leading-tight font-extrabold"
          >
            {lines[index]}
          </m.p>
        </AnimatePresence>
      </div>

      <ul className="mt-6 space-y-4">
        {promises.map((item, i) => (
          <m.li
            key={item.text}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.12 }}
            className="flex items-center gap-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15">
              <item.icon aria-hidden="true" className="size-5" />
            </span>
            <span className="font-medium">{item.text}</span>
          </m.li>
        ))}
      </ul>

      <m.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={
          reduce ? { opacity: 1, y: 0, rotate: -3 } : { opacity: 1, y: [0, -8, 0], rotate: -3 }
        }
        transition={{
          opacity: { delay: 0.6 },
          y: reduce ? { delay: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        className="text-ink mt-auto ml-auto w-64 rounded-3xl bg-white p-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)]"
      >
        <div className="flex items-center gap-3">
          <span className="from-saffron to-pen grid size-10 place-items-center rounded-full bg-gradient-to-br text-white">
            <Video className="size-5" />
          </span>
          <p className="font-display text-lg leading-tight font-bold">Session booked</p>
        </div>
        <p className="bg-paper mt-3 flex items-center gap-2 rounded-xl p-2.5 text-sm">
          <CalendarCheck className="text-pen size-4" />
          Today, 7:30 PM · 30 min
        </p>
      </m.div>
    </aside>
  );
}

/** Slim animated strip shown above the form on phones and tablets. */
export function AuthStrip() {
  return (
    <div
      aria-hidden="true"
      className="relative isolate -mx-4 -mt-10 mb-[-3.5rem] h-36 overflow-hidden bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] sm:-mt-16 lg:hidden"
    >
      <div className="bg-saffron/40 absolute -top-24 -right-16 -z-10 size-72 rounded-full blur-3xl" />
      <Bubbles count={4} height={200} />
    </div>
  );
}

/** The form card's entrance. */
export function AuthCardMotion({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="relative"
    >
      {children}
    </m.div>
  );
}
