import "server-only";
import {
  and,
  bookings,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  mentorProfiles,
  payments,
  refunds,
  sql,
} from "@chayan/db";
import { BOOKING_POLICY, SESSION_POLICY } from "@chayan/shared";
import { getServerEnv } from "@/env";
import { writeAuditLog } from "@/lib/audit";
import { notifyNoShow } from "@/lib/booking-emails";
import { executeRefund } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { createRoom, endRoom, isVideoConfigured } from "@/lib/video/hms";

const MINUTE = 60_000;

export type SessionRole = "mentor" | "aspirant";

export function joinWindow(booking: { startsAt: Date; endsAt: Date }) {
  return {
    opensAt: new Date(booking.startsAt.getTime() - SESSION_POLICY.joinOpensMinutesBefore * MINUTE),
    closesAt: new Date(booking.endsAt.getTime() + SESSION_POLICY.closeAfterEndMinutes * MINUTE),
  };
}

export function isJoinOpen(
  booking: { startsAt: Date; endsAt: Date; status: string },
  now = new Date(),
) {
  const { opensAt, closesAt } = joinWindow(booking);
  return booking.status === "confirmed" && now >= opensAt && now < closesAt;
}

/** Creates the 100ms room for a booking once, and reuses it after that. */
export async function ensureVideoRoom(bookingId: string): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ roomId: bookings.videoRoomId })
    .from(bookings)
    .where(eq(bookings.id, bookingId));
  if (existing?.roomId) return existing.roomId;

  const roomId = await createRoom(`booking-${bookingId}`);
  // Only the first writer wins if two people join at the same moment.
  const [saved] = await db
    .update(bookings)
    .set({ videoRoomId: roomId })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.videoRoomId)))
    .returning({ roomId: bookings.videoRoomId });
  if (saved?.roomId) return saved.roomId;
  const [winner] = await db
    .select({ roomId: bookings.videoRoomId })
    .from(bookings)
    .where(eq(bookings.id, bookingId));
  return winner!.roomId!;
}

/**
 * Records that a participant is in the call. With a 100ms webhook secret set,
 * only provider events count, because they can't be faked from the browser.
 */
export async function recordPresence(input: {
  bookingId: string;
  role: SessionRole;
  at: Date;
  source: "client" | "provider";
}) {
  if (input.source === "client" && getServerEnv().HMS_WEBHOOK_SECRET) return;
  const first =
    input.role === "mentor" ? bookings.mentorFirstJoinedAt : bookings.aspirantFirstJoinedAt;
  const last = input.role === "mentor" ? "mentorLastSeenAt" : "aspirantLastSeenAt";
  const firstKey = input.role === "mentor" ? "mentorFirstJoinedAt" : "aspirantFirstJoinedAt";
  await getDb()
    .update(bookings)
    .set({
      [firstKey]: sql`coalesce(${first}, ${input.at.toISOString()}::timestamptz)`,
      [last]: input.at,
    })
    .where(eq(bookings.id, input.bookingId));
}

/* ------------------------------------------------------------------ */
/* Scheduled work: no-shows, completion, closing rooms                 */
/* ------------------------------------------------------------------ */

type NoShowOutcome = {
  bookingId: string;
  who: SessionRole;
  refundId: string | null;
  refundPaise: number;
  suspendedMentor: boolean;
};

async function settleNoShow(bookingId: string, now: Date): Promise<NoShowOutcome | null> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, "confirmed")))
      .for("update", { skipLocked: true });
    if (!booking) return null;

    const deadline = booking.startsAt.getTime() + SESSION_POLICY.noShowGraceMinutes * MINUTE;
    const onTime = (at: Date | null) => at !== null && at.getTime() <= deadline;

    let who: SessionRole | null = null;
    if (!onTime(booking.mentorFirstJoinedAt)) who = "mentor";
    else if (!onTime(booking.aspirantFirstJoinedAt)) who = "aspirant";
    if (!who) return null;

    const refundPaise =
      who === "mentor"
        ? booking.pricePaise
        : Math.round((booking.pricePaise * BOOKING_POLICY.lateCancelRefundPercent) / 100);

    await tx
      .update(bookings)
      .set({
        status: who === "mentor" ? "no_show_mentor" : "no_show_aspirant",
        finalizedAt: now,
        cancelReason:
          who === "mentor"
            ? "The mentor didn't join within 10 minutes of the start"
            : "The aspirant didn't join within 10 minutes of the start",
      })
      .where(eq(bookings.id, booking.id));

    let refundId: string | null = null;
    const [payment] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.bookingId, booking.id), eq(payments.status, "captured")));
    if (payment && refundPaise > 0) {
      const [refund] = await tx
        .insert(refunds)
        .values({
          paymentId: payment.id,
          amountPaise: Math.min(refundPaise, payment.amountPaise),
          reason: who === "mentor" ? "Mentor no-show" : "Aspirant no-show (50% policy)",
        })
        .returning();
      refundId = refund!.id;
    }

    let suspendedMentor = false;
    if (who === "mentor") {
      await tx
        .update(mentorProfiles)
        .set({ noShowCount: sql`${mentorProfiles.noShowCount} + 1` })
        .where(eq(mentorProfiles.userId, booking.mentorUserId));
      const [recent] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(bookings)
        .where(
          and(
            eq(bookings.mentorUserId, booking.mentorUserId),
            eq(bookings.status, "no_show_mentor"),
            gte(bookings.startsAt, new Date(now.getTime() - 30 * 24 * 60 * MINUTE)),
          ),
        );
      if ((recent?.total ?? 0) >= SESSION_POLICY.mentorNoShowLimit) {
        const [paused] = await tx
          .update(mentorProfiles)
          .set({ status: "suspended" })
          .where(
            and(
              eq(mentorProfiles.userId, booking.mentorUserId),
              eq(mentorProfiles.status, "active"),
            ),
          )
          .returning({ userId: mentorProfiles.userId });
        suspendedMentor = Boolean(paused);
      }
    }

    await writeAuditLog(tx, {
      actorUserId: null,
      action: `booking.no_show_${who}`,
      entityType: "booking",
      entityId: booking.id,
      details: { refundPaise, suspendedMentor },
    });
    return { bookingId: booking.id, who, refundId, refundPaise, suspendedMentor };
  });
}

async function closeRoom(bookingId: string, roomId: string | null) {
  if (roomId && isVideoConfigured()) {
    try {
      await endRoom(roomId, "The session time is over");
    } catch (error) {
      console.error("Could not end 100ms room", error);
      return;
    }
  }
  await getDb().update(bookings).set({ roomEndedAt: new Date() }).where(eq(bookings.id, bookingId));
}

export async function runSessionHousekeeping(now = new Date()) {
  const db = getDb();
  const summary = { expiredHolds: 0, noShows: 0, completed: 0, roomsClosed: 0 };

  const expired = await db
    .update(bookings)
    .set({ status: "expired", holdExpiresAt: null })
    .where(and(eq(bookings.status, "pending_payment"), lt(bookings.holdExpiresAt, now)))
    .returning({ id: bookings.id });
  summary.expiredHolds = expired.length;

  // No-shows: decided 10 minutes after the start.
  const graceCutoff = new Date(now.getTime() - SESSION_POLICY.noShowGraceMinutes * MINUTE);
  const candidates = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), lt(bookings.startsAt, graceCutoff)))
    .limit(100);
  for (const candidate of candidates) {
    const outcome = await settleNoShow(candidate.id, now);
    if (!outcome) continue;
    summary.noShows++;
    if (outcome.refundId) await executeRefund(outcome.refundId);
    await notifyNoShow(
      outcome.bookingId,
      outcome.who,
      outcome.refundPaise,
      outcome.suspendedMentor,
    );
  }

  // Completed: both joined on time and the session is over.
  const endCutoff = new Date(now.getTime() - SESSION_POLICY.closeAfterEndMinutes * MINUTE);
  const done = await db
    .update(bookings)
    .set({ status: "completed", finalizedAt: now })
    .where(and(eq(bookings.status, "confirmed"), lt(bookings.endsAt, endCutoff)))
    .returning({ id: bookings.id });
  summary.completed = done.length;

  // Close rooms for anything finished or settled.
  const toClose = await db
    .select({ id: bookings.id, roomId: bookings.videoRoomId })
    .from(bookings)
    .where(
      and(
        isNull(bookings.roomEndedAt),
        inArray(bookings.status, [
          "completed",
          "no_show_mentor",
          "no_show_aspirant",
          "cancelled_by_aspirant",
          "cancelled_by_mentor",
        ]),
        lt(bookings.startsAt, now),
      ),
    )
    .limit(100);
  for (const row of toClose) {
    await closeRoom(row.id, row.roomId);
    summary.roomsClosed++;
  }

  return summary;
}
