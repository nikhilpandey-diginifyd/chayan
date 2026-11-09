"use client";

import { NavTabs } from "@/components/ui/nav-tabs";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/mentors", label: "Mentor applications", exact: false },
  { href: "/admin/bookings", label: "Bookings", exact: false },
  { href: "/admin/payouts", label: "Payouts", exact: false },
  { href: "/admin/reviews", label: "Reviews", exact: false },
  { href: "/admin/papers", label: "Papers", exact: false },
  { href: "/admin/videos", label: "Videos", exact: false },
] as const;

export function AdminNav() {
  return <NavTabs label="Admin" tabs={links} id="admin-nav" />;
}
