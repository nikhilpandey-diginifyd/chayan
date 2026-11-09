"use client";

import { useState, type ReactNode } from "react";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

/**
 * The sticky header frame: it tightens and gains a shadow once you scroll,
 * and an orange bar along its bottom edge shows how far down the page you are.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 12));
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-line/80 bg-white/85 shadow-[0_8px_24px_-14px_rgb(40_44_63/0.25)] backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-white/60 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6",
          scrolled ? "h-14" : "h-16",
        )}
      >
        {children}
      </div>
      <m.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="from-saffron to-pen absolute inset-x-0 -bottom-px h-[3px] origin-left bg-gradient-to-r"
      />
    </header>
  );
}
