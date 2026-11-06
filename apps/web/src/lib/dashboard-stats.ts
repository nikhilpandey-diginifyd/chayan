import "server-only";
import { and, bookings, count, desc, eq, gte, isNull, reviews, sql, users } from "@chayan/db";
import { REVIEW_POLICY } from "@chayan/shared";
import { getDb } from "@/lib/db";

export async function getMentorStats(mentorUserId: string) {
  const db = getDb();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [totals] = await db
    .select({
      completed: sql<number>`count(*) filter (where ${bookings.status} = 'completed')::int`,
      earnedPaise: sql<number>`coalesce(sum(${bookings.mentorEarningsPaise}) filter (where ${bookings.status} = 'completed'), 0)::int`,
      earnedThisMonthPaise: sql<number>`coalesce(sum(${bookings.mentorEarningsPaise}) filter (where ${bookings.status} = 'completed' and ${bookings.startsAt} >= ${monthStart.toISOString()}::timestamptz), 0)::int`,
      notesPending: sql<number>`count(*) filter (where ${bookings.status} = 'completed' and ${bookings.notesUpdatedAt} is null)::int`,
    })
    .from(bookings)
    .where(eq(bookings.mentorUserId, mentorUserId));

  return totals ?? { completed: 0, earnedPaise: 0, earnedThisMonthPaise: 0, notesPending: 0 };
}

/** Completed sessions the aspirant can still review. */
export async function getSessionsToReview(aspirantUserId: string) {
  const since = new Date(Date.now() - REVIEW_POLICY.editableDays * 24 * 60 * 60_000);
  return getDb()
    .select({ id: bookings.id, startsAt: bookings.startsAt, mentorName: users.name })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.mentorUserId))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.aspirantUserId, aspirantUserId),
        eq(bookings.status, "completed"),
        gte(bookings.endsAt, since),
        isNull(reviews.id),
      ),
    )
    .orderBy(desc(bookings.startsAt))
    .limit(5);
}

export async function countHiddenReviews() {
  const [row] = await getDb()
    .select({ total: count() })
    .from(reviews)
    .where(eq(reviews.isHidden, true));
  return row?.total ?? 0;
}
