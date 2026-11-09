"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const exams = ["UPSC CSE", "SSC CGL", "SSC CHSL", "SSC CPO", "SSC GD", "SSC MTS"];

/** The hero headline. The exam name at the end changes every few seconds. */
export function RotatingHeadline() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % exams.length), 2400);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <h1 className="mt-5 max-w-xl text-[2.6rem] leading-[1.06] font-extrabold sm:text-6xl lg:text-[4.1rem]">
      <span className="sr-only">Ask someone who has already cleared UPSC or SSC.</span>
      <span aria-hidden="true">
        Ask someone who has already cleared{" "}
        <span className="relative inline-grid overflow-hidden align-bottom">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={exams[index]}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-pen col-start-1 row-start-1 whitespace-nowrap"
            >
              {exams[index]}.
            </m.span>
          </AnimatePresence>
          <span
            className="bg-omr/80 absolute right-1 bottom-1 left-0 -z-10 h-[0.18em] origin-left rounded-full"
            style={{ transform: "skewX(-12deg)" }}
          />
        </span>
      </span>
    </h1>
  );
}
