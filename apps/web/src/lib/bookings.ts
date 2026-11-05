import "server-only";
import {
  and,
  bookings,
  count,
  eq,
  gt,
  inArray,
  lt,
  mentorAvailabilityRules,
  mentorBlockedDates,
  mentorProfiles,
  mentorServices,
  or,
  payments,
  refunds,
  sql,
  type Database,
} from "@chayan/db";
import {
  aspirantCancellationRefundPaise,
  BOOKING_POLICY,
  canReschedule,
  generateSlots,
  mentorEarningsPaise,
  platformFeePaise,
  type BusyInterval,
} from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingRescheduled,
} from "@/lib/booking-emails";
import { getPaymentProvider, type ProviderName } from "@/lib/payments/provider";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Executor = Database | Tx;

export class BookingError extends Error {
  constructor(
    public readonly code:
      | "slot_unavailable"
      | "not_bookable"
      | "own_profile"
      | "too_many_holds"
      | "not_found"
      | "not_allowed"
      | "payment_failed",
    message: string,
  ) {
    super(message);
  }
}

/** Active = confirmed, or a payment hold that hasn't expired. */
function activeBookingCondition() {
  return or(
    eq(bookings.status, "confirmed"),
    and(eq(bookings.status, "pending_payment"), gt(bookings.holdExpiresAt, sql`now()`)),
  );
}

export async function getBusyIntervals(
  mentorIds: string[],
  db: Executor = getDb(),
  options: { excludeBookingId?: string } = {},
): Promise<Map<string, BusyInterval[]>> {
  const result = new Map<string, BusyInterval[]>();
  if (mentorIds.length === 0) return result;
  const rows = await db
    .select({
      id: bookings.id,
      mentorUserId: bookings.mentorUserId,
      start: bookings.startsAt,
      end: bookings.endsAt,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.mentorUserId, mentorIds),
        activeBookingCondition(),
        gt(bookings.endsAt, sql`now() - interval '1 day'`),
      ),
    );
  for (const row of rows) {
    if (row.id === options.excludeBookingId) continue;
    const list = result.get(row.mentorUserId) ?? [];
    list.push({ start: row.start, end: row.end });
    result.set(row.mentorUserId, list);
  }
  return result;
}

/** Marks this mentor's expired payment holds as expired, inside a mentor lock. */
async function expireStaleHolds(tx: Tx, mentorUserId: string) {
  await tx
    .update(bookings)
    .set({ status: "expired", holdExpiresAt: null })
    .where(
      and(
        eq(bookings.mentorUserId, mentorUserId),
        eq(bookings.status, "pending_payment"),
        lt(bookings.holdExpiresAt, sql`now()`),
      ),
    );
}

/** Locks the mentor row so bookings for one mentor are decided one at a time. */
async function lockMentor(tx: Tx, mentorUserId: string) {
  const [mentor] = await tx
    .select()
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, mentorUserId))
    .for("update");
  return mentor;
}

async function isSlotOpen(
  tx: Tx,
  mentor: typeof mentorProfiles.$inferSelect,
  durationMinutes: number,
  startsAt: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const [rules, blocked, busyMap] = await Promise.all([
    tx
      .select()
      .from(mentorAvailabilityRules)
      .where(eq(mentorAvailabilityRules.mentorUserId, mentor.userId)),
    tx.select().from(mentorBlockedDates).where(eq(mentorBlockedDates.mentorUserId, mentor.userId)),
    getBusyIntervals([mentor.userId], tx, { excludeBookingId }),
  ]);
  const slots = generateSlots({
    rules,
    blockedDates: blocked.map((row) => row.date),
    busy: busyMap.get(mentor.userId) ?? [],
    durationMinutes,
    bufferMinutes: mentor.bufferMinutes,
    minNoticeHours: mentor.minNoticeHours,
    bookingWindowDays: mentor.bookingWindowDays,
  });
  return slots.some((slot) => slot.getTime() === startsAt.getTime());
}

function isOverlapViolation(error: unknown) {
  return (
    (error as { code?: string; cause?: { code?: string } }).code === "23P01" ||
    (error as { cause?: { code?: string } }).cause?.code === "23P01"
  );
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export async function createPendingBooking(input: {
  aspirantUserId: string;
  mentorUserId: string;
  durationMinutes: number;
  startsAt: Date;
  note: string | null;
}): Promise<{ bookingId: string }> {
  if (input.aspirantUserId === input.mentorUserId) {
    throw new BookingError("own_profile", "You can't book a session with yourself.");
  }
  const db = getDb();

  const booking = await db
    .transaction(async (tx) => {
      const mentor = await lockMentor(tx, input.mentorUserId);
      if (!mentor || mentor.status !== "active" || !mentor.isPublished) {
        throw new BookingError("not_bookable", "This mentor isn't taking bookings right now.");
      }

      const [service] = await tx
        .select()
        .from(mentorServices)
        .where(
          and(
            eq(mentorServices.mentorUserId, mentor.userId),
            eq(mentorServices.durationMinutes, input.durationMinutes),
            eq(mentorServices.isActive, true),
          ),
        );
      if (!service) {
        throw new BookingError("not_bookable", "This session length is no longer offered.");
      }

      const [holds] = await tx
        .select({ total: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.aspirantUserId, input.aspirantUserId),
            eq(bookings.status, "pending_payment"),
            gt(bookings.holdExpiresAt, sql`now()`),
          ),
        );
      if ((holds?.total ?? 0) >= BOOKING_POLICY.maxPendingHoldsPerAspirant) {
        throw new BookingError(
          "too_many_holds",
          "You have unpaid bookings waiting. Pay for them or let them expire first.",
        );
      }

      await expireStaleHolds(tx, mentor.userId);
      if (!(await isSlotOpen(tx, mentor, input.durationMinutes, input.startsAt))) {
        throw new BookingError(
          "slot_unavailable",
          "That time was just taken. Choose another slot.",
        );
      }

      const [row] = await tx
        .insert(bookings)
        .values({
          aspirantUserId: input.aspirantUserId,
          mentorUserId: mentor.userId,
          durationMinutes: input.durationMinutes,
          startsAt: input.startsAt,
          endsAt: new Date(input.startsAt.getTime() + input.durationMinutes * 60_000),
          status: "pending_payment",
          holdExpiresAt: new Date(Date.now() + BOOKING_POLICY.holdMinutes * 60_000),
          pricePaise: service.pricePaise,
          platformFeePaise: platformFeePaise(service.pricePaise),
          mentorEarningsPaise: mentorEarningsPaise(service.pricePaise),
          aspirantNote: input.note,
        })
        .returning();
      return row!;
    })
    .catch((error: unknown) => {
      if (isOverlapViolation(error)) {
        throw new BookingError(
          "slot_unavailable",
          "That time was just taken. Choose another slot.",
        );
      }
      throw error;
    });

  const provider = getPaymentProvider();
  try {
    const order = await provider.createOrder({
      amountPaise: booking.pricePaise,
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });
    await db.insert(payments).values({
      bookingId: booking.id,
      provider: provider.name,
      providerOrderId: order.orderId,
      amountPaise: booking.pricePaise,
    });
  } catch (error) {
    console.error("Could not create payment order", error);
    await db
      .update(bookings)
      .set({ status: "expired", holdExpiresAt: null, cancelReason: "Payment order failed" })
      .where(eq(bookings.id, booking.id));
    throw new BookingError(
      "payment_failed",
      "We couldn't start the payment. Try again in a minute.",
    );
  }

  return { bookingId: booking.id };
}

/* ------------------------------------------------------------------ */
/* Payment outcomes                                                    */
/* ------------------------------------------------------------------ */

/**
 * Records a captured payment and confirms the booking. Safe to call more than
 * once for the same payment (checkout callback and webhook both call it).
 * If the hold expired and someone else took the slot, the payment is refunded.
 */
export async function confirmPayment(input: {
  provider: ProviderName;
  orderId: string;
  paymentId: string;
  method?: string | null;
}): Promise<{ bookingId: string; outcome: "confirmed" | "already_confirmed" | "refunded" }> {
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(
        and(eq(payments.provider, input.provider), eq(payments.providerOrderId, input.orderId)),
      )
      .for("update");
    if (!payment) throw new BookingError("not_found", "Payment not found.");

    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .for("update");
    if (!booking) throw new BookingError("not_found", "Booking not found.");

    if (
      payment.status === "captured" ||
      payment.status === "refunded" ||
      payment.status === "partially_refunded"
    ) {
      return { booking, payment, outcome: "already_confirmed" as const };
    }

    await tx
      .update(payments)
      .set({
        status: "captured",
        providerPaymentId: input.paymentId,
        method: input.method ?? null,
        capturedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (booking.status === "confirmed") {
      return { booking, payment, outcome: "already_confirmed" as const };
    }

    // Try to confirm. A savepoint lets us recover if the slot was taken meanwhile.
    try {
      await tx.transaction(async (savepoint) => {
        if (booking.status !== "pending_payment" && booking.status !== "expired") {
          throw new BookingError("not_allowed", "Booking can't be confirmed");
        }
        await savepoint
          .update(bookings)
          .set({ status: "confirmed", holdExpiresAt: null })
          .where(eq(bookings.id, booking.id));
      });
      return { booking, payment, outcome: "confirmed" as const };
    } catch (error) {
      if (!isOverlapViolation(error) && !(error instanceof BookingError)) throw error;
      await tx
        .update(bookings)
        .set({
          status: "expired",
          holdExpiresAt: null,
          cancelReason: "Paid after the slot was taken",
        })
        .where(eq(bookings.id, booking.id));
      const [refund] = await tx
        .insert(refunds)
        .values({
          paymentId: payment.id,
          amountPaise: payment.amountPaise,
          reason: "Slot no longer available when payment arrived",
        })
        .returning();
      return { booking, payment, outcome: "refunded" as const, refundId: refund!.id };
    }
  });

  if (result.outcome === "confirmed") {
    await notifyBookingConfirmed(result.booking.id);
  }
  if (result.outcome === "refunded" && "refundId" in result) {
    await executeRefund(result.refundId as string);
    await notifyBookingCancelled(result.booking.id, "system", result.payment.amountPaise);
  }
  return { bookingId: result.booking.id, outcome: result.outcome };
}

export async function markPaymentFailed(input: {
  provider: ProviderName;
  orderId: string;
  reason: string;
}) {
  await getDb()
    .update(payments)
    .set({ status: "failed", failureReason: input.reason.slice(0, 500) })
    .where(
      and(
        eq(payments.provider, input.provider),
        eq(payments.providerOrderId, input.orderId),
        eq(payments.status, "created"),
      ),
    );
}

/** Sends a pending refund to the provider and records the outcome. */
export async function executeRefund(refundId: string) {
  const db = getDb();
  const refund = await db.query.refunds.findFirst({
    where: eq(refunds.id, refundId),
    with: { payment: true },
  });
  if (!refund || refund.status !== "pending" || refund.providerRefundId) return;
  if (!refund.payment.providerPaymentId) return;

  try {
    const provider = getPaymentProvider();
    const result = await provider.refund({
      paymentId: refund.payment.providerPaymentId,
      amountPaise: refund.amountPaise,
      notes: { bookingId: refund.payment.bookingId, reason: refund.reason.slice(0, 200) },
    });
    await db.transaction(async (tx) => {
      await tx
        .update(refunds)
        .set({ providerRefundId: result.refundId, status: result.status })
        .where(eq(refunds.id, refund.id));
      const refundedPaise = refund.payment.refundedPaise + refund.amountPaise;
      await tx
        .update(payments)
        .set({
          refundedPaise,
          status: refundedPaise >= refund.payment.amountPaise ? "refunded" : "partially_refunded",
        })
        .where(eq(payments.id, refund.payment.id));
    });
  } catch (error) {
    console.error("Refund failed", error);
    await db
      .update(refunds)
      .set({ status: "failed", failureReason: String(error).slice(0, 500) })
      .where(eq(refunds.id, refund.id));
  }
}

/* ------------------------------------------------------------------ */
/* Cancel and reschedule                                               */
/* ------------------------------------------------------------------ */

export type CancelActor = "aspirant" | "mentor" | "admin";

export function refundForCancellation(
  actor: CancelActor,
  booking: { pricePaise: number; startsAt: Date },
  now = new Date(),
) {
  return actor === "aspirant"
    ? aspirantCancellationRefundPaise(booking.pricePaise, booking.startsAt, now)
    : booking.pricePaise;
}

export async function cancelBooking(input: {
  bookingId: string;
  actor: CancelActor;
  actorUserId: string;
  reason: string | null;
}): Promise<{ refundPaise: number }> {
  const db = getDb();

  const outcome = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update");
    if (!booking) throw new BookingError("not_found", "Booking not found.");

    const allowed =
      input.actor === "admin" ||
      (input.actor === "aspirant" && booking.aspirantUserId === input.actorUserId) ||
      (input.actor === "mentor" && booking.mentorUserId === input.actorUserId);
    if (!allowed) throw new BookingError("not_allowed", "You can't cancel this booking.");

    if (booking.status === "pending_payment") {
      await tx
        .update(bookings)
        .set({ status: "cancelled_by_aspirant", holdExpiresAt: null, cancelledAt: new Date() })
        .where(eq(bookings.id, booking.id));
      return { booking, refundPaise: 0, refundId: null as string | null, wasConfirmed: false };
    }
    if (booking.status !== "confirmed") {
      throw new BookingError("not_allowed", "This booking can't be cancelled any more.");
    }
    if (input.actor !== "admin" && booking.startsAt.getTime() <= Date.now()) {
      throw new BookingError("not_allowed", "This session has already started.");
    }

    const refundPaise = refundForCancellation(input.actor, booking);
    await tx
      .update(bookings)
      .set({
        status: input.actor === "aspirant" ? "cancelled_by_aspirant" : "cancelled_by_mentor",
        cancelledAt: new Date(),
        cancelReason: input.reason,
      })
      .where(eq(bookings.id, booking.id));

    let refundId: string | null = null;
    if (refundPaise > 0) {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.bookingId, booking.id), eq(payments.status, "captured")));
      if (payment) {
        const [refund] = await tx
          .insert(refunds)
          .values({
            paymentId: payment.id,
            amountPaise: Math.min(refundPaise, payment.amountPaise),
            reason: `Cancelled by ${input.actor}`,
          })
          .returning();
        refundId = refund!.id;
      }
    }

    await writeAuditLog(tx, {
      actorUserId: input.actorUserId,
      action: `booking.cancelled_by_${input.actor}`,
      entityType: "booking",
      entityId: booking.id,
      details: { refundPaise, reason: input.reason },
    });
    return { booking, refundPaise, refundId, wasConfirmed: true };
  });

  if (outcome.refundId) await executeRefund(outcome.refundId);
  if (outcome.wasConfirmed) {
    await notifyBookingCancelled(outcome.booking.id, input.actor, outcome.refundPaise);
  }
  return { refundPaise: outcome.refundPaise };
}

export async function rescheduleBooking(input: {
  bookingId: string;
  aspirantUserId: string;
  newStartsAt: Date;
}) {
  const db = getDb();
  const previousStart = await db
    .transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .for("update");
      if (!booking || booking.aspirantUserId !== input.aspirantUserId) {
        throw new BookingError("not_found", "Booking not found.");
      }
      if (
        booking.status !== "confirmed" ||
        !canReschedule(booking.startsAt, booking.rescheduleCount)
      ) {
        throw new BookingError("not_allowed", "This booking can't be rescheduled.");
      }

      const mentor = await lockMentor(tx, booking.mentorUserId);
      if (!mentor || mentor.status !== "active") {
        throw new BookingError("not_bookable", "This mentor isn't taking bookings right now.");
      }
      await expireStaleHolds(tx, mentor.userId);
      if (!(await isSlotOpen(tx, mentor, booking.durationMinutes, input.newStartsAt, booking.id))) {
        throw new BookingError(
          "slot_unavailable",
          "That time was just taken. Choose another slot.",
        );
      }

      await tx
        .update(bookings)
        .set({
          startsAt: input.newStartsAt,
          endsAt: new Date(input.newStartsAt.getTime() + booking.durationMinutes * 60_000),
          rescheduleCount: booking.rescheduleCount + 1,
        })
        .where(eq(bookings.id, booking.id));
      await writeAuditLog(tx, {
        actorUserId: input.aspirantUserId,
        action: "booking.rescheduled",
        entityType: "booking",
        entityId: booking.id,
        details: { from: booking.startsAt.toISOString(), to: input.newStartsAt.toISOString() },
      });
      return booking.startsAt;
    })
    .catch((error: unknown) => {
      if (isOverlapViolation(error)) {
        throw new BookingError(
          "slot_unavailable",
          "That time was just taken. Choose another slot.",
        );
      }
      throw error;
    });

  await notifyBookingRescheduled(input.bookingId, previousStart);
}
