import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PREP_LANGUAGE_LABELS } from "@chayan/shared";
import { BookingList } from "@/components/bookings/booking-list";
import { ButtonLink } from "@/components/ui/button";
import { listBookingsFor } from "@/lib/booking-queries";
import { getApplicationForUser, getMentorProfile } from "@/lib/mentor-applications";
import { getAspirantProfile, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  if (await getMentorProfile(user.id)) redirect("/mentor");

  const profile = await getAspirantProfile(user.id);
  if (!profile) {
    redirect((await getApplicationForUser(user.id)) ? "/mentor/apply" : "/onboarding");
  }

  const firstName = user.name.split(" ")[0] ?? user.name;
  const upcoming = await listBookingsFor({
    role: "aspirant",
    userId: user.id,
    when: "upcoming",
    limit: 5,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Namaste, {firstName}</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section
          aria-labelledby="sessions-heading"
          className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8"
        >
          <h2 id="sessions-heading" className="text-xl font-bold">
            Your sessions
          </h2>
          <div className="mt-2">
            <BookingList
              items={upcoming}
              perspective="aspirant"
              empty={`No sessions booked yet. Find a verified ${profile.exam.shortName} mentor to get started.`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`/mentors?exam=${profile.exam.code}`} size="sm">
              Find a mentor
            </ButtonLink>
            <ButtonLink href="/bookings" variant="secondary" size="sm">
              All my sessions
            </ButtonLink>
          </div>
        </section>

        <section
          aria-labelledby="prep-heading"
          className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8"
        >
          <h2 id="prep-heading" className="text-xl font-bold">
            Your preparation
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-ink-muted text-sm">Exam</dt>
              <dd className="font-semibold">{profile.exam.shortName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Stage</dt>
              <dd className="font-semibold">{profile.stage.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Target year</dt>
              <dd className="font-semibold">{profile.targetYear}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Attempt</dt>
              <dd className="font-semibold">
                {profile.attemptNumber === 1 ? "First" : profile.attemptNumber}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Language</dt>
              <dd className="font-semibold">{PREP_LANGUAGE_LABELS[profile.language]}</dd>
            </div>
          </dl>
          <ButtonLink href="/onboarding" variant="secondary" size="sm" className="mt-6">
            Edit details
          </ButtonLink>
        </section>
      </div>

      {user.role === "admin" ? (
        <p className="text-ink-muted mt-8">
          You have admin access.{" "}
          <Link href="/admin" className="text-pen font-semibold">
            Open the admin panel
          </Link>
        </p>
      ) : null}
    </div>
  );
}
