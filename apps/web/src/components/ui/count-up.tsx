"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Counts up to a number when it scrolls into view. Server-rendered with the
 * final value, so the right number shows even before JavaScript loads.
 */
export function CountUp({
  value,
  format = "number",
}: {
  value: number;
  format?: "number" | "rupees";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduce || value === 0) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  const text =
    format === "rupees"
      ? `₹${Math.round(display / 100).toLocaleString("en-IN")}`
      : Math.round(display).toLocaleString("en-IN");
  return (
    <span ref={ref} className="tabular-nums">
      {text}
    </span>
  );
}
