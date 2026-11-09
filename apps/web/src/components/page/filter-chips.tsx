"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

export type FilterChip = { href: string; label: string; active: boolean };

/** A row of filter links with a pill that slides to the active one. Works on the orange banner. */
export function FilterChips({
  chips,
  id,
  label,
}: {
  chips: FilterChip[];
  id: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-2">
        {chips.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              scroll={false}
              aria-current={chip.active ? "page" : undefined}
              className={cn(
                "relative block rounded-full border px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
                chip.active
                  ? "text-pen-dark border-white"
                  : "border-white/40 text-white hover:bg-white/10",
              )}
            >
              {chip.active ? (
                <m.span
                  layoutId={`${id}-chip`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white shadow-[0_8px_20px_-10px_rgb(0_0_0/0.5)]"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              ) : null}
              <span className="relative">{chip.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
