"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "What if my mentor doesn't join?",
    a: "You get a full refund automatically if the mentor doesn't join within 10 minutes of the start. Mentors who miss sessions repeatedly are paused.",
  },
  {
    q: "Can I cancel or move a session?",
    a: "Cancel 12 hours or more before the start for a full refund, or later for a 50% refund. You can move a session once, up to 12 hours before it starts.",
  },
  {
    q: "How do you know mentors really cleared the exam?",
    a: "We check each mentor's official result or marksheet against the published list, match it to a government ID and PAN, and hold a trial session before the profile goes live.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. Sessions run in your browser on a phone or computer. Camera is optional, and you can share your screen or a photo of your answer copy.",
  },
  {
    q: "Which languages are sessions in?",
    a: "Hindi, English or Hinglish. Every mentor lists the languages they're comfortable in, and you can filter by language.",
  },
  {
    q: "Are sessions recorded?",
    a: "No. Chayan doesn't record calls. Your mentor can leave written notes and next steps on the booking page after the session.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-line border-line divide-y rounded-[var(--radius-panel)] border bg-white">
      {faqs.map((item, index) => {
        const isOpen = open === index;
        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="hover:text-pen flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-lg font-semibold transition-colors sm:px-6"
              >
                {item.q}
                <m.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className={`grid size-8 shrink-0 place-items-center rounded-full ${isOpen ? "bg-pen text-white" : "bg-pen-soft text-pen"}`}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </m.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <m.div
                  id={`faq-${index}`}
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-ink-muted px-5 pb-5 sm:px-6">{item.a}</p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
