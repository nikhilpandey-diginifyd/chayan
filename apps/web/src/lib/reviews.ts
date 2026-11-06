import "server-only";
import {
  and,
  bookings,
  desc,
  eq,
  mentorProfiles,
  reviews,
  sql,
  users,
  type Database,
} from "@chayan/db";
import { REVIEW_POLICY, REVIEW_TAGS, type ReviewTag } from "@chayan/shared";
import { getDb } from "@/lib/db";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
const DAY = 24 * 60 * 60_000;

/** Recalculates a mentor's rating from visible reviews. */
async function refreshMentorRating(tx: Tx, mentorUserId: string) {
  await tx
    .update(mentorProfiles)
    .set({
      ratingSum: sql`(select coalesce(sum(r.rating), 0)::int from ${reviews} r where r.mentor_user_id = ${mentorUserId} and not r.is_hidden)`,
      ratingCount: sql`(select count(*)::int from ${reviews} r where r.mentor_user_id = ${mentorUserId} and not r.is_hidden)`,
    })
    .where(eq(mentorProfiles.userId, mentorUserId));
}

export function reviewWindowOpen(endsAt: Date, now = new Date()) {
  return now.getTime() - endsAt.getTime() <= REVIEW_POLICY.editableDays * DAY;
}

export class ReviewError extends Error {}

export async function saveReview(input: {
  bookingId: string;
  aspirantUserId: string;
  rating: number;
  tags: string[];
  comment: string | null;
  mentorOnCamera: "yes" | "no" | "partly" | null;
}) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ReviewError("Choose a rating from 1 to 5 stars.");
  }
  const tags = [...new Set(input.tags)].filter((tag): tag is ReviewTag =>
    (REVIEW_TAGS as readonly string[]).includes(tag),
  );
  const comment = input.comment?.trim().slice(0, REVIEW_POLICY.commentMaxLength) || null;

  await getDb().transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update");
    if (!booking || booking.aspirantUserId !== input.aspirantUserId) {
      throw new ReviewError("Booking not found.");
    }
    if (booking.status !== "completed") {
      throw new ReviewError("You can review a session once it's completed.");
    }
    if (!reviewWindowOpen(booking.endsAt)) {
      throw new ReviewError("Reviews close 7 days after the session.");
    }

    await tx
      .insert(reviews)
      .values({
        bookingId: booking.id,
        mentorUserId: booking.mentorUserId,
        aspirantUserId: booking.aspirantUserId,
        rating: input.rating,
        tags,
        comment,
        mentorOnCamera: input.mentorOnCamera,
      })
      .onConflictDoUpdate({
        target: reviews.bookingId,
        set: { rating: input.rating, tags, comment, mentorOnCamera: input.mentorOnCamera },
      });
    await refreshMentorRating(tx, booking.mentorUserId);
  });
}

export async function setReviewHidden(reviewId: string, hidden: boolean, reason: string | null) {
  await getDb().transaction(async (tx) => {
    const [row] = await tx
      .update(reviews)
      .set({ isHidden: hidden, hiddenReason: hidden ? reason : null })
      .where(eq(reviews.id, reviewId))
      .returning({ mentorUserId: reviews.mentorUserId });
    if (row) await refreshMentorRating(tx, row.mentorUserId);
  });
}

export async function listMentorReviews(mentorUserId: string, limit = 20) {
  return getDb()
    .select({
      id: reviews.id,
      rating: reviews.rating,
      tags: reviews.tags,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.aspirantUserId))
    .where(and(eq(reviews.mentorUserId, mentorUserId), eq(reviews.isHidden, false)))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export function averageRating(sum: number, count: number): number | null {
  return count > 0 ? Math.round((sum / count) * 10) / 10 : null;
}
