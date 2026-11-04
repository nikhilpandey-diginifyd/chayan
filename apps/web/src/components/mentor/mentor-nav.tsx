"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/mentor", label: "Overview" },
  { href: "/mentor/profile", label: "Profile" },
  { href: "/mentor/sessions", label: "Sessions and prices" },
  { href: "/mentor/availability", label: "Availability" },
] as const;

export function MentorNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mentor" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="border-line flex min-w-max gap-1 border-b">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 font-semibold whitespace-nowrap",
                active ? "border-pen text-ink" : "text-ink-muted hover:text-ink border-transparent",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
