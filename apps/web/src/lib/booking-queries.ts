import "server-only";
import {
  aliasedTable,
  and,
  asc,
  bookings,
  desc,
  eq,
  exams,
  gte,
  inArray,
  lt,
  mentorProfiles,
  or,
  payments,
  refunds,
  users,
} from "@chayan/db";
import { getDb } from "@/lib/db";

/** Full booking with both people, for the booking detail page. */
export async function getBookingDetail(bookingId: string) {
  const db = getDb();
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: {
      payments: {
        with: { refunds: { orderBy: asc(refunds.createdAt) } },
        orderBy: desc(payments.createdAt),
      },
      mentor: {
        columns: { slug: true, photoKey: true, badge: true, examYear: true, userId: true },
        with: {
          exam: { columns: { shortName: true } },
          user: { columns: { name: true, email: true } },
        },
      },
      aspirant: { columns: { id: true, name: true, email: true } },
      review: true,
    },
  });
  return booking ?? null;
}

export type BookingDetail = NonNullable<Awaited<ReturnType<typeof getBookingDetail>>>;

const mentorUser = aliasedTable(users, "mentor_user");
const aspirantUser = aliasedTable(users, "aspirant_user");

export async function listBookingsFor(options: {
  role: "aspirant" | "mentor";
  userId: string;
  when: "upcoming" | "past";
  limit?: number;
}) {
  const db = getDb();
  const owner =
    options.role === "aspirant"
      ? eq(bookings.aspirantUserId, options.userId)
      : eq(bookings.mentorUserId, options.userId);
  const now = new Date();
  const timeCondition =
    options.when === "upcoming"
      ? and(gte(bookings.endsAt, now), inArray(bookings.status, ["confirmed", "pending_payment"]))
      : or(
          lt(bookings.endsAt, now),
          inArray(bookings.status, [
            "cancelled_by_aspirant",
            "cancelled_by_mentor",
            "completed",
            "no_show_mentor",
            "no_show_aspirant",
          ]),
        );

  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      durationMinutes: bookings.durationMinutes,
      status: bookings.status,
      holdExpiresAt: bookings.holdExpiresAt,
      pricePaise: bookings.pricePaise,
      mentorEarningsPaise: bookings.mentorEarningsPaise,
      aspirantNote: bookings.aspirantNote,
      mentorName: mentorUser.name,
      aspirantName: aspirantUser.name,
      mentorSlug: mentorProfiles.slug,
      examShortName: exams.shortName,
    })
    .from(bookings)
    .innerJoin(mentorProfiles, eq(mentorProfiles.userId, bookings.mentorUserId))
    .innerJoin(exams, eq(exams.id, mentorProfiles.examId))
    .innerJoin(mentorUser, eq(mentorUser.id, bookings.mentorUserId))
    .innerJoin(aspirantUser, eq(aspirantUser.id, bookings.aspirantUserId))
    .where(and(owner, timeCondition))
    .orderBy(options.when === "upcoming" ? asc(bookings.startsAt) : desc(bookings.startsAt))
    .limit(options.limit ?? 50);
}

export type BookingListItem = Awaited<ReturnType<typeof listBookingsFor>>[number];
