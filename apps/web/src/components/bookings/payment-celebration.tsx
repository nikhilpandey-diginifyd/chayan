"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const colors = ["#fc8019", "#c24e08", "#138a5e", "#e23744", "#ffd25e"];
const pieces = Array.from({ length: 28 }, (_, i) => ({
  angle: (i / 28) * Math.PI * 2 + (i % 3) * 0.2,
  distance: 90 + (i % 5) * 28,
  color: colors[i % colors.length]!,
  size: 6 + (i % 3) * 3,
  round: i % 2 === 0,
}));

/** Shown once after a successful payment: a tick draws itself and confetti bursts out. */
export function PaymentCelebration({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="border-seal/30 relative overflow-hidden rounded-[var(--radius-panel)] border bg-gradient-to-br from-[#e5f6ee] to-white p-6 text-center sm:p-8">
      <div className="relative mx-auto grid size-24 place-items-center">
        {!reduce
          ? pieces.map((piece, i) => (
              <m.span
                key={i}
                aria-hidden="true"
                className={`absolute ${piece.round ? "rounded-full" : "rounded-sm"}`}
                style={{ width: piece.size, height: piece.size, backgroundColor: piece.color }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(piece.angle) * piece.distance,
                  y: Math.sin(piece.angle) * piece.distance + 40,
                  opacity: 0,
                  rotate: 220,
                }}
                transition={{ duration: 1.4, ease: [0.2, 0.8, 0.3, 1], delay: 0.35 }}
              />
            ))
          : null}
        <m.svg
          viewBox="0 0 96 96"
          className="size-24"
          aria-hidden="true"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <circle cx="48" cy="48" r="44" fill="var(--color-seal)" />
          <m.path
            d="M28 49l13 13 27-28"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          />
        </m.svg>
      </div>
      <m.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="font-display text-ink mt-4 text-3xl font-extrabold"
      >
        Session booked! 🎉
      </m.p>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-ink-muted mt-1"
      >
        {children}
      </m.div>
    </div>
  );
}
