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
}: {
  label: string;
  tabs: readonly NavTab[];
  id: string;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="border-line flex min-w-max gap-1 border-b">
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
                active ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <span className="relative z-10">{tab.label}</span>
              {active ? (
                <m.span
                  layoutId={`${id}-active`}
                  aria-hidden="true"
                  className="bg-pen absolute inset-x-2 -bottom-px h-[3px] rounded-full"
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
