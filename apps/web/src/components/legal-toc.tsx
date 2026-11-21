"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

type Heading = { id: string; text: string };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/**
 * "On this page" list for policy pages. Reads the section headings, gives
 * them link targets, and highlights the section you're reading.
 */
export function LegalToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLHeadingElement>(".prose-legal h2")];
    const found = elements.map((element) => {
      if (!element.id)
        element.id =
          slugify(element.textContent ?? "") || `section-${Math.random().toString(36).slice(2, 7)}`;
      element.style.scrollMarginTop = "6rem";
      return { id: element.id, text: element.textContent ?? "" };
    });
    // Reading DOM headings after render is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(found);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 2) return null;
  return (
    <nav
      aria-label="On this page"
      className="panel border-line sticky top-24 hidden rounded-[var(--radius-card)] border bg-white p-4 lg:block"
    >
      <p className="text-ink-muted text-xs font-bold tracking-wide">On this page</p>
      <ul className="mt-2 space-y-0.5">
        {headings.map((heading) => {
          const isActive = heading.id === active;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "relative block rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive ? "text-pen font-semibold" : "text-ink-muted hover:text-ink",
                )}
              >
                {isActive ? (
                  <m.span
                    layoutId="legal-toc-active"
                    aria-hidden="true"
                    className="bg-pen-soft absolute inset-0 rounded-lg"
                    transition={{ type: "spring", stiffness: 450, damping: 36 }}
                  />
                ) : null}
                <span className="relative">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
