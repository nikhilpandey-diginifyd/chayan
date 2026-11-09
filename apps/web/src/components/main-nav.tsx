"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { BookOpen, FileText, Menu, PlayCircle, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/mentors", label: "Find a mentor", icon: Users, primary: true },
  { href: "/papers", label: "Papers", icon: FileText },
  { href: "/videos", label: "Videos", icon: PlayCircle },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const isActive = useActive();
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <nav
      aria-label="Main"
      className="hidden items-center gap-0.5 sm:flex"
      onMouseLeave={() => setHovered(null)}
    >
      {links.map((link) => {
        const active = isActive(link.href);
        const showPill = hovered ? hovered === link.href : active;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => setHovered(link.href)}
            onFocus={() => setHovered(link.href)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 font-semibold whitespace-nowrap transition-colors duration-150",
              active ? "text-pen" : "text-ink hover:text-pen",
            )}
          >
            {showPill ? (
              <m.span
                layoutId="main-nav-pill"
                aria-hidden="true"
                className="bg-pen-soft absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            ) : null}
            <link.icon aria-hidden="true" className="relative size-4" />
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone menu: the links that don't fit in the header. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useActive();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
        className="text-ink hover:bg-pen-soft grid size-10 place-items-center rounded-full"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>
      <AnimatePresence>
        {open ? (
          <m.div
            key={pathname}
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="border-line absolute inset-x-0 top-16 border-b bg-white px-4 pt-2 pb-4 shadow-[var(--shadow-raised)]"
          >
            <ul className="space-y-1">
              {[...links, { href: "/dashboard", label: "Dashboard", icon: BookOpen }].map(
                (link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-3 font-semibold",
                        isActive(link.href) ? "bg-pen-soft text-pen" : "text-ink hover:bg-paper",
                      )}
                    >
                      <link.icon aria-hidden="true" className="size-5" />
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
