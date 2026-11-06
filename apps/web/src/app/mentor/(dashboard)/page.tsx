import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { formatRupees, MENTOR_BADGE_INFO } from "@chayan/shared";
import { setProfilePublished } from "./actions";
import { Button } from "@/components/ui/button";
import { BookingList } from "@/components/bookings/booking-list";
import { RatingBadge } from "@/components/rating";
import { listBookingsFor } from "@/lib/booking-queries";
import { getMentorStats } from "@/lib/dashboard-stats";
import { canPublish, publishChecklist, requireMentor } from "@/lib/mentor-profile";

export const metadata: Metadata = { title: "Mentor dashboard", robots: { index: false } };

export default async function MentorOverviewPage() {
  const { user, mentor } = await requireMentor("/mentor");
  const firstName = user.name.split(" ")[0] ?? user.name;
  const badge = MENTOR_BADGE_INFO[mentor.badge];
  const checklist = publishChecklist(mentor);
  const ready = canPublish(mentor);
  const activeServices = mentor.services.filter((service) => service.isActive);
  const [upcoming, stats] = await Promise.all([
    listBookingsFor({
      role: "mentor",
      userId: user.id,
      when: "upcoming",
      limit: 5,
    }),
    getMentorStats(user.id),
  ]);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Namaste, {firstName}</h1>
      <p className="text-ink-muted mt-3 flex flex-wrap items-center gap-2">
        <span className="bg-seal-soft text-seal inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold">
          <BadgeCheck aria-hidden="true" className="size-4" />
          {badge.label}
        </span>
        {mentor.exam.shortName} {mentor.examYear}
        {mentor.rank ? `, ${mentor.rank}` : null}
      </p>

      {mentor.status === "suspended" ? (
        <p className="border-omr/40 bg-omr-soft mt-8 max-w-prose rounded-[var(--radius-control)] border px-4 py-3">
          Your mentor profile is paused by our team, so aspirants can&apos;t find or book you. Write
          to support to find out more.
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="border-line bg-surface rounded-[var(--radius-control)] border p-4">
          <dt className="text-ink-muted text-sm">Rating</dt>
          <dd className="mt-1">
            <RatingBadge sum={mentor.ratingSum} count={mentor.ratingCount} />
          </dd>
        </div>
        <div className="border-line bg-surface rounded-[var(--radius-control)] border p-4">
          <dt className="text-ink-muted text-sm">Completed sessions</dt>
          <dd className="mt-1 text-2xl font-bold">{stats.completed}</dd>
        </div>
        <div className="border-line bg-surface rounded-[var(--radius-control)] border p-4">
          <dt className="text-ink-muted text-sm">Earned this month</dt>
          <dd className="mt-1 text-2xl font-bold">{formatRupees(stats.earnedThisMonthPaise)}</dd>
        </div>
        <div className="border-line bg-surface rounded-[var(--radius-control)] border p-4">
          <dt className="text-ink-muted text-sm">Earned in total</dt>
          <dd className="mt-1 text-2xl font-bold">{formatRupees(stats.earnedPaise)}</dd>
        </div>
      </dl>
      {stats.notesPending > 0 ? (
        <p className="mt-4 text-sm">
          <strong>{stats.notesPending}</strong> completed session
          {stats.notesPending === 1 ? "" : "s"} {stats.notesPending === 1 ? "is" : "are"} waiting
          for your notes.{" "}
          <Link href="/mentor/bookings" className="text-pen font-semibold">
            Add notes
          </Link>
        </p>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
          <h2 className="text-xl font-bold">
            {mentor.isPublished ? "Your profile is live" : "Get ready for bookings"}
          </h2>
          <p className="text-ink-muted mt-2">
            {mentor.isPublished
              ? "Aspirants can find and book you from the mentor list."
              : "Finish these steps, then publish your profile so aspirants can find you."}
          </p>
          <ul className="mt-6 space-y-3">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-3">
                {item.done ? (
                  <CheckCircle2 aria-hidden="true" className="text-seal mt-0.5 size-5 shrink-0" />
                ) : (
                  <Circle aria-hidden="true" className="text-ink-muted mt-0.5 size-5 shrink-0" />
                )}
                <span>
                  <Link
                    href={item.href}
                    className={item.done ? "text-ink-muted" : "text-pen font-semibold"}
                  >
                    {item.label}
                  </Link>
                  <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                </span>
              </li>
            ))}
          </ul>

          <form action={setProfilePublished} className="mt-8 flex flex-wrap items-center gap-3">
            <input type="hidden" name="publish" value={mentor.isPublished ? "false" : "true"} />
            {mentor.isPublished ? (
              <Button type="submit" variant="secondary">
                Unpublish profile
              </Button>
            ) : (
              <Button type="submit" disabled={!ready}>
                Publish profile
              </Button>
            )}
            <Link
              href={`/mentors/${mentor.slug}`}
              className="text-pen inline-flex items-center gap-1.5 font-semibold"
              target="_blank"
            >
              {mentor.isPublished ? "View public profile" : "Preview profile"}
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
          </form>
        </section>

        <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
          <h2 className="text-xl font-bold">Your sessions</h2>
          {activeServices.length === 0 ? (
            <p className="text-ink-muted mt-3">No session lengths set yet.</p>
          ) : (
            <ul className="divide-line mt-4 divide-y">
              {activeServices.map((service) => (
                <li key={service.id} className="flex justify-between py-2">
                  <span>{service.durationMinutes} minutes</span>
                  <span className="font-semibold">{formatRupees(service.pricePaise)}</span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-8 font-bold">Upcoming bookings</h3>
          <BookingList
            items={upcoming.filter((item) => item.status === "confirmed")}
            perspective="mentor"
            empty="No bookings yet."
          />
          <Link
            href="/mentor/bookings"
            className="text-pen mt-2 inline-block text-sm font-semibold"
          >
            All bookings
          </Link>
        </section>
      </div>
    </div>
  );
}
