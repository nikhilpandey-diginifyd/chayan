"use client";

import { useRef } from "react";
import { useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { BadgeCheck, CalendarCheck, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Pick a mentor for your exam and stage",
    text: "Filter by exam, stage, language and price. Every profile shows how we verified the mentor's result.",
  },
  {
    icon: CalendarCheck,
    title: "Book a slot and pay securely",
    text: "Choose a 15, 30 or 60 minute session. Pay with UPI, card or net banking through Razorpay.",
  },
  {
    icon: BadgeCheck,
    title: "Join the video call from your browser",
    text: "Talk one-to-one, share your screen or a photo of your answer copy, and leave with a clear plan.",
  },
];

/** "How a session works": the line between steps fills as you scroll. */
export function SessionJourney() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  return (
    <ol ref={ref} className="relative mt-12 grid gap-8 md:grid-cols-3">
      <div
        aria-hidden="true"
        className="bg-line absolute top-0 bottom-0 left-5 w-0.5 md:top-5 md:right-[16%] md:bottom-auto md:left-[16%] md:h-0.5 md:w-auto"
      />
      <m.div
        aria-hidden="true"
        style={{ scaleY: progress }}
        className="bg-omr absolute top-0 bottom-0 left-5 w-0.5 origin-top md:hidden"
      />
      <m.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="bg-omr absolute top-5 right-[16%] left-[16%] hidden h-0.5 origin-left md:block"
      />
      {steps.map((step, index) => (
        <m.li
          key={step.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
          className="relative pl-16 md:pl-0"
        >
          <span className="border-omr text-omr absolute top-0 left-0 grid size-10 place-items-center rounded-full border-2 bg-white font-semibold md:relative md:mx-auto">
            {index + 1}
          </span>
          <div className="card-link border-line bg-surface rounded-[var(--radius-card)] border p-6 md:mt-5">
            <step.icon aria-hidden="true" className="text-pen size-6" />
            <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
            <p className="text-ink-muted mt-2">{step.text}</p>
          </div>
        </m.li>
      ))}
    </ol>
  );
}
