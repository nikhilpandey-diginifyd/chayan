import type { ReactNode } from "react";
import { MentorNav } from "@/components/mentor/mentor-nav";
import { requireMentor } from "@/lib/mentor-profile";

export default async function MentorDashboardLayout({ children }: { children: ReactNode }) {
  await requireMentor("/mentor");
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <MentorNav />
      {children}
    </div>
  );
}
