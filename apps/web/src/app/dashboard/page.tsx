import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PREP_LANGUAGE_LABELS } from "@chayan/shared";
import { CalendarDays, FileText, PlayCircle, Star, Users } from "lucide-react";
import { BookingList } from "@/components/bookings/booking-list";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { NextSessionCountdown } from "@/components/dashboard/next-session-countdown";
import { ButtonLink } from "@/components/ui/button";
import { formatSessionTime } from "@/lib/booking-emails";
import { listBookingsFor } from "@/lib/booking-queries";
import { getSessionsToReview } from "@/lib/dashboard-stats";
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
  const [upcoming, toReview] = await Promise.all([
    listBookingsFor({
      role: "aspirant",
      userId: user.id,
      when: "upcoming",
      limit: 5,
    }),
    getSessionsToReview(user.id),
  ]);

  const nextSession = upcoming.find((item) => item.status === "confirmed") ?? null;

  return (
    <>
      <DashboardHero
        greeting={`Namaste, ${firstName}`}
        lines={[
          "Aaj ka target: ek kadam aage.",
          "Consistency > intensity.",
          "Doubt ho to pooch lo, wahi smart hai.",
          `${profile.exam.shortName} ${profile.targetYear}, aap kar sakte ho.`,
        ]}
        chips={[
          profile.exam.shortName,
          profile.stage.name,
          `Target ${profile.targetYear}`,
          profile.attemptNumber === 1 ? "First attempt" : `Attempt ${profile.attemptNumber}`,
          PREP_LANGUAGE_LABELS[profile.language],
        ]}
        aside={
          <NextSessionCountdown
            session={
              nextSession
                ? {
                    id: nextSession.id,
                    startsAt: nextSession.startsAt.toISOString(),
                    mentorName: nextSession.mentorName,
                    whenLabel: formatSessionTime(nextSession.startsAt),
                  }
                : null
            }
          />
        }
      />
      <div className="relative mx-auto -mt-8 max-w-6xl px-4 pb-16 sm:px-6">
        <ul className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            {
              href: `/mentors?exam=${profile.exam.code}`,
              label: `${profile.exam.shortName} mentors`,
              sub: "Book a 1:1 call",
              icon: Users,
              tone: "bg-pen-soft text-pen",
            },
            {
              href: `/papers?exam=${profile.exam.code}`,
              label: "Previous papers",
              sub: "Solve and compare",
              icon: FileText,
              tone: "bg-omr-soft text-omr",
            },
            {
              href: `/videos?exam=${profile.exam.code}`,
              label: "Prep videos",
              sub: "2 to 5 minute lessons",
              icon: PlayCircle,
              tone: "bg-seal-soft text-seal",
            },
            {
              href: "/bookings",
              label: "My sessions",
              sub: "Upcoming and past",
              icon: CalendarDays,
              tone: "bg-[#fff4c2] text-[#8a6400]",
            },
          ].map((item, index) => (
            <li key={item.href} style={{ "--i": index } as React.CSSProperties}>
              <Link
                href={item.href}
                className="card-link border-line bg-surface group flex h-full flex-col gap-3 rounded-[var(--radius-card)] border p-4 sm:p-5"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${item.tone}`}
                >
                  <item.icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{item.label}</span>
                  <span className="text-ink-muted text-sm">{item.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {toReview.length > 0 ? (
          <section className="border-saffron/40 panel from-saffron-soft mt-8 flex gap-4 rounded-[var(--radius-panel)] border bg-gradient-to-r to-white p-5">
            <Star
              aria-hidden="true"
              className="fill-saffron text-saffron size-8 shrink-0 animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none"
            />
            <div>
              <h2 className="font-bold">Rate your recent sessions</h2>
              <ul className="mt-2 space-y-1">
                {toReview.map((item) => (
                  <li key={item.id}>
                    <Link href={`/bookings/${item.id}#review`} className="text-pen font-semibold">
                      {item.mentorName}, {formatSessionTime(item.startsAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section
            aria-labelledby="sessions-heading"
            className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-6 sm:p-8"
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
            className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-6 sm:p-8"
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
    </>
  );
}
