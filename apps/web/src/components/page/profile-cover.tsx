"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

/** Orange cover strip on a mentor's profile card, with slowly drifting answer bubbles. */
export function ProfileCover() {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="relative h-32 overflow-hidden bg-gradient-to-br from-[#e06a12] via-[#c24e08] to-[#8f3804]"
    >
      <div className="bg-saffron/50 absolute -top-20 -right-10 size-56 rounded-full blur-2xl" />
      {[10, 26, 44, 63, 80, 92].map((left, i) => (
        <m.span
          key={left}
          className="absolute rounded-full border-2 border-white/30"
          style={{
            left: `${left}%`,
            top: `${20 + ((i * 37) % 55)}%`,
            width: 10 + (i % 3) * 8,
            height: 10 + (i % 3) * 8,
          }}
          animate={reduce ? undefined : { y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <m.span
        className="absolute top-5 right-6 grid size-14 place-items-center rounded-full border-2 border-white/70"
        animate={reduce ? undefined : { rotate: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="size-8 rounded-full bg-white/90" />
      </m.span>
    </div>
  );
}
