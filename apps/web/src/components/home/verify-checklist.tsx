"use client";

import * as m from "motion/react-m";
import { FileText, IdCard, Video } from "lucide-react";

const items = [
  { icon: FileText, text: "Official result or marksheet, matched against the published list" },
  { icon: IdCard, text: "Government ID and PAN, matched to the name on the result" },
  { icon: Video, text: "A short trial session with our team before the profile goes live" },
];

/** The three verification checks, ticked off one by one as they scroll in. */
export function VerifyChecklist() {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <m.li
          key={item.text}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.18 }}
          className="flex items-center gap-4 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm"
        >
          <span className="text-seal-soft grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
            <item.icon aria-hidden="true" className="size-5" />
          </span>
          <span className="flex-1 text-white/90">{item.text}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 shrink-0">
            <m.circle
              cx="12"
              cy="12"
              r="10.5"
              fill="none"
              stroke="#5fd39a"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.18 }}
            />
            <m.path
              d="M7 12.5l3.2 3.2L17 9"
              fill="none"
              stroke="#5fd39a"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.7 + index * 0.18 }}
            />
          </svg>
        </m.li>
      ))}
    </ul>
  );
}
