import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import {
  FOCUS_AREA_LABELS,
  publicReviewerName,
  REVIEW_TAG_LABELS,
  type ReviewTag,
  generateSlots,
  MENTOR_BADGE_INFO,
  PREP_LANGUAGE_LABELS,
} from "@chayan/shared";
import { SlotPicker } from "@/components/directory/slot-picker";
import { Avatar } from "@/components/mentor/avatar";
import { FormMessage } from "@/components/ui/field";
import { getPublicMentor } from "@/lib/mentor-directory";
import { photoUrl } from "@/lib/mentor-profile";
import { RatingBadge } from "@/components/rating";
import { listMentorReviews } from "@/lib/reviews";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mentor = await getPublicMentor(slug);
  if (!mentor) return { title: "Mentor not found", robots: { index: false } };
  const badge = MENTOR_BADGE_INFO[mentor.badge].label;
  return {
    title: `${mentor.user.name}, ${badge} ${mentor.exam.shortName} ${mentor.examYear}`,
    description: mentor.headline ?? mentor.bio.slice(0, 155),
    alternates: { canonical: `/mentors/${slug}` },
  };
}

export default async function MentorProfilePage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) notFound();

  const session = await getSession();
  let mentor = await getPublicMentor(slug);
  let previewing = false;
  if (!mentor && session) {
    const draft = await getPublicMentor(slug, { includeUnpublished: true });
    if (draft && (draft.userId === session.user.id || session.user.role === "admin")) {
      mentor = draft;
      previewing = true;
    }
  }
  if (!mentor) notFound();

  const now = new Date();
  const slotsByDuration = mentor.services.map((service) => ({
    durationMinutes: service.durationMinutes,
    pricePaise: service.pricePaise,
    slots: generateSlots({
      rules: mentor.availabilityRules,
      blockedDates: mentor.blockedDates.map((row) => row.date),
      busy: mentor.busy,
      durationMinutes: service.durationMinutes,
      bufferMinutes: mentor.bufferMinutes,
      minNoticeHours: mentor.minNoticeHours,
      bookingWindowDays: mentor.bookingWindowDays,
      now,
    }).map((slot) => slot.toISOString()),
  }));

  const badge = MENTOR_BADGE_INFO[mentor.badge];
  const recentReviews = await listMentorReviews(mentor.userId, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {previewing ? (
        <div className="mb-8">
          <FormMessage tone="info">
            <strong>Preview.</strong> Only you can see this page until the profile is published.{" "}
            <Link href="/mentor" className="text-pen font-semibold">
              Back to your dashboard
            </Link>
          </FormMessage>
        </div>
      ) : null}

      <Link href="/mentors" className="text-pen text-sm font-semibold">
        All mentors
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={mentor.user.name} url={photoUrl(mentor.photoKey)} size={112} />
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{mentor.user.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                <span className="bg-seal-soft text-seal inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
                  <BadgeCheck aria-hidden="true" className="size-4" />
                  {badge.label}
                </span>
                <span className="text-ink-muted">
                  {mentor.exam.shortName} {mentor.examYear}
                  {mentor.rank ? `, ${mentor.rank}` : ""}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <RatingBadge sum={mentor.ratingSum} count={mentor.ratingCount} size="lg" />
          </div>

          {mentor.headline ? <p className="mt-6 text-xl">{mentor.headline}</p> : null}

          <h2 className="mt-10 text-xl font-bold">About</h2>
          <p className="text-ink-muted mt-3 whitespace-pre-line">{mentor.bio}</p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {mentor.focusAreas.length > 0 ? (
              <div>
                <dt className="font-semibold">Helps with</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {mentor.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="border-line bg-surface rounded-full border px-3 py-1 text-sm"
                    >
                      {FOCUS_AREA_LABELS[area]}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold">Languages</dt>
              <dd className="text-ink-muted mt-2">
                {mentor.languages.map((language) => PREP_LANGUAGE_LABELS[language]).join(", ")}
              </dd>
            </div>
          </dl>

          <h2 className="mt-10 text-xl font-bold">Reviews</h2>
          {recentReviews.length === 0 ? (
            <p className="text-ink-muted mt-3">
              No reviews yet. Reviews come only from completed sessions.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {recentReviews.map((review) => (
                <li
                  key={review.id}
                  className="border-line bg-surface rounded-[var(--radius-control)] border p-4"
                >
                  <p className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{publicReviewerName(review.reviewerName)}</span>
                    <span className="text-omr text-sm" aria-label={`${review.rating} out of 5`}>
                      {"★".repeat(review.rating)}
                      <span className="text-line">{"★".repeat(5 - review.rating)}</span>
                    </span>
                  </p>
                  {review.tags.length > 0 ? (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-paper text-ink-muted rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {REVIEW_TAG_LABELS[tag as ReviewTag] ?? tag}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  {review.comment ? (
                    <p className="text-ink-muted mt-2 whitespace-pre-line">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="border-line bg-surface mt-10 flex gap-3 rounded-[var(--radius-panel)] border p-5">
            <ShieldCheck aria-hidden="true" className="text-seal mt-0.5 size-6 shrink-0" />
            <p className="text-ink-muted text-sm">
              <strong className="text-ink">How we verified this mentor:</strong> our team checked
              their official {mentor.exam.shortName} {mentor.examYear} result document against the
              published result and matched the name to a government photo ID.
            </p>
          </div>
        </article>

        <aside className="min-w-0">
          <div className="border-line bg-surface rounded-[var(--radius-panel)] border p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-bold">Book a session</h2>
            <SlotPicker
              options={slotsByDuration}
              slug={slug}
              viewer={
                !session
                  ? "signed_out"
                  : session.user.id === mentor.userId
                    ? "self"
                    : previewing
                      ? "preview"
                      : "aspirant"
              }
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
