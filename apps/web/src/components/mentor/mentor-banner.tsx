"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { BadgeCheck, ExternalLink, Star } from "lucide-react";
import { MentorNav } from "@/components/mentor/mentor-nav";

const lines = [
  "Aapka experience, kisi ka selection.",
  "Har session, ek aspirant ka confidence.",
  "Jo aapko kisi ne nahi bataya, aap bata sakte ho.",
];

const ease = [0.22, 1, 0.36, 1] as const;

/** Orange banner across every mentor page, with the section tabs on it. */
export function MentorBanner({
  name,
  badge,
  published,
  slug,
  rating,
}: {
  name: string;
  badge: string;
  published: boolean;
  slug: string | null;
  rating: string | null;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % lines.length), 3400);
    return () => clearInterval(timer);
  }, [reduce]);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#c94f07] via-[#b84806] to-[#8f3804] text-white">
      <div
        aria-hidden="true"
        className="bg-saffron/40 absolute -top-40 -right-24 -z-10 size-[26rem] rounded-full blur-3xl"
      />
      {!reduce
        ? [10, 36, 66, 88].map((left, i) => (
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
              animate={{ y: [0, -320], opacity: [0, 0.9, 0] }}
              transition={{
                duration: 7 + i * 1.5,
                repeat: Infinity,
                delay: i * 1.1,
                ease: "linear",
              }}
            />
          ))
        : null}
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-wrap items-center justify-between gap-5"
        >
          <div className="flex items-center gap-4">
            <span className="font-display grid size-14 shrink-0 place-items-center rounded-full border-2 border-white/70 bg-white/15 text-xl font-extrabold backdrop-blur">
              {initials}
            </span>
            <div>
              <p className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
                {name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5">
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  {badge}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5">
                  <span className="relative flex size-2">
                    {published ? (
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5fd39a] opacity-75 motion-reduce:hidden" />
                    ) : null}
                    <span
                      className={`relative inline-flex size-2 rounded-full ${published ? "bg-[#5fd39a]" : "bg-white/60"}`}
                    />
                  </span>
                  {published ? "Live" : "Not live yet"}
                </span>
                {rating ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5">
                    <Star aria-hidden="true" className="size-3.5 fill-white" />
                    {rating}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {published && slug ? (
            <Link
              href={`/mentors/${slug}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] border-2 border-white/60 px-4 text-sm font-bold transition-colors hover:bg-white/10"
            >
              Your public profile
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </m.div>
        <div className="mt-4 h-7 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={lines[index]}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              className="font-display text-lg font-bold text-[#ffd9b8]"
            >
              {lines[index]}
            </m.p>
          </AnimatePresence>
        </div>
        <div className="mt-4">
          <MentorNav tone="dark" />
        </div>
      </div>
    </section>
  );
}
