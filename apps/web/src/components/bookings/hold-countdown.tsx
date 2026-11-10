"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as m from "motion/react-m";

const HOLD_SECONDS = 10 * 60;
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring that drains as the 10-minute slot hold runs out. Turns red in the last two minutes. */
export function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) router.refresh();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, router]);

  if (secondsLeft === null) return <p className="h-16" aria-hidden="true" />;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const urgent = secondsLeft <= 120;
  const fraction = Math.min(1, secondsLeft / HOLD_SECONDS);
  const color = urgent ? "var(--color-omr)" : "var(--color-saffron)";

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-3 pr-5 ${urgent ? "border-omr/30 bg-omr-soft" : "border-saffron/30 bg-saffron-soft"}`}
      role="timer"
      aria-live="off"
    >
      <m.svg
        viewBox="0 0 64 64"
        className="size-16 shrink-0 -rotate-90"
        aria-hidden="true"
        animate={urgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 1, repeat: Infinity } : undefined}
      >
        <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="white" strokeWidth="6" />
        <m.circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - fraction) }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </m.svg>
      <p className="text-ink">
        <span className="block text-sm font-semibold">
          Slot held for you for{" "}
          <strong className="font-display text-xl tabular-nums" style={{ color }}>
            {minutes}:{seconds}
          </strong>
        </span>
        <span className="text-ink-muted text-sm">
          {urgent
            ? "Jaldi karo, slot chhootne wala hai."
            : "Nobody else can book this time while you pay."}
        </span>
      </p>
    </div>
  );
}
