import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { MENTOR_BADGE_INFO } from "@chayan/shared";
import { getMentorProfile } from "@/lib/mentor-applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mentor dashboard", robots: { index: false } };

export default async function MentorDashboardPage() {
  const user = await requireUser("/mentor");
  const profile = await getMentorProfile(user.id);
  if (!profile) redirect("/mentor/apply");

  const firstName = user.name.split(" ")[0] ?? user.name;
  const badge = MENTOR_BADGE_INFO[profile.badge];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Namaste, {firstName}</h1>
      <p className="text-ink-muted mt-3 flex flex-wrap items-center gap-2">
        <span className="bg-seal-soft text-seal inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold">
          <BadgeCheck aria-hidden="true" className="size-4" />
          {badge.label}
        </span>
        {profile.exam.shortName} {profile.examYear}
        {profile.rank ? `, ${profile.rank}` : null}
      </p>

      {profile.status === "suspended" ? (
        <p className="border-omr/40 bg-omr-soft mt-8 max-w-prose rounded-[var(--radius-control)] border px-4 py-3">
          Your mentor profile is paused. Write to support to find out more.
        </p>
      ) : null}

      <section className="border-line bg-surface mt-10 rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h2 className="text-xl font-bold">Get ready for bookings</h2>
        <p className="text-ink-muted mt-3 max-w-prose">
          Next, you&apos;ll set your session prices and the hours you&apos;re available. Your
          profile becomes visible to aspirants once both are set. This part opens shortly.
        </p>
      </section>
    </div>
  );
}
