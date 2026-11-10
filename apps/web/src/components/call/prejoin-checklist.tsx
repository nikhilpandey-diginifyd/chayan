"use client";

import { useState } from "react";
import * as m from "motion/react-m";

const items = [
  "Quiet place, earphones if you have them",
  "Face towards a window or light",
  "Questions written down",
  "Answer copy or notes ready to share",
];

/** A tick-off list shown before joining a call. Purely for the person's own readiness. */
export function PrejoinChecklist() {
  const [checked, setChecked] = useState<number[]>([]);
  const allDone = checked.length === items.length;
  return (
    <div className="border-line mt-5 rounded-2xl border bg-white p-4">
      <p className="flex items-center justify-between text-sm font-bold">
        Ready ho?
        <span className={allDone ? "text-seal" : "text-ink-muted"}>
          {allDone ? "Sab set! 🎯" : `${checked.length}/${items.length}`}
        </span>
      </p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {items.map((item, index) => {
          const on = checked.includes(index);
          return (
            <li key={item}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setChecked(on ? checked.filter((i) => i !== index) : [...checked, index])
                }
                className="hover:bg-paper flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm"
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-seal bg-seal" : "border-line"}`}
                >
                  <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
                    <m.path
                      d="M5 10.5l3.2 3.2L15 7"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: on ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    />
                  </svg>
                </span>
                <span className={on ? "text-ink-muted line-through" : ""}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
