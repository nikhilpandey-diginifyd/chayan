"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

export type NavTab = { href: string; label: string; exact?: boolean };

/**
 * Section tabs for dashboards. The active marker slides between tabs, which
 * shows where you moved from and to.
 */
export function NavTabs({
  label,
  tabs,
  id,
  tone = "light",
}: {
  label: string;
  tabs: readonly NavTab[];
  id: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div
        className={cn("flex min-w-max gap-1 border-b", dark ? "border-white/20" : "border-line")}
      >
        {tabs.map((tab) => {
          const active =
            tab.exact === false ? pathname.startsWith(tab.href) : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative px-3 py-2.5 font-semibold whitespace-nowrap transition-colors duration-150",
                dark
                  ? active
                    ? "text-white"
                    : "text-white/75 hover:text-white"
                  : active
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink",
              )}
            >
              <span className="relative z-10">{tab.label}</span>
              {active ? (
                <m.span
                  layoutId={`${id}-active`}
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-[3px] rounded-full",
                    dark ? "bg-white" : "bg-pen",
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
