"use client";

import { NavTabs } from "@/components/ui/nav-tabs";

const links = [
  { href: "/mentor", label: "Overview" },
  { href: "/mentor/bookings", label: "Bookings" },
  { href: "/mentor/profile", label: "Profile" },
  { href: "/mentor/sessions", label: "Sessions and prices" },
  { href: "/mentor/availability", label: "Availability" },
  { href: "/mentor/earnings", label: "Earnings" },
] as const;

export function MentorNav() {
  return <NavTabs label="Mentor" tabs={links} id="mentor-nav" />;
}
