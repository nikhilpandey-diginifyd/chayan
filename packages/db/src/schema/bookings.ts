import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./auth";
import { mentorProfiles } from "./mentors";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending_payment",
  "confirmed",
  "cancelled_by_aspirant",
  "cancelled_by_mentor",
  "expired",
  "completed",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["razorpay", "mock"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "captured",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const refundStatusEnum = pgEnum("refund_status", ["pending", "processed", "failed"]);

/**
 * A session between an aspirant and a mentor. Prices and the fee split are
 * copied at booking time so later price changes never affect existing bookings.
 * Overlapping active bookings for the same mentor are blocked by a database
 * exclusion constraint (see migration 0005).
 */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    aspirantUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    mentorUserId: uuid()
      .notNull()
      .references(() => mentorProfiles.userId, { onDelete: "restrict" }),
    durationMinutes: integer().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    status: bookingStatusEnum().notNull().default("pending_payment"),
    holdExpiresAt: timestamp({ withTimezone: true }),

    pricePaise: integer().notNull(),
    platformFeePaise: integer().notNull(),
    mentorEarningsPaise: integer().notNull(),

    aspirantNote: text(),
    rescheduleCount: integer().notNull().default(0),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelReason: text(),
    ...timestamps,
  },
  (t) => [
    index("bookings_mentor_starts_idx").on(t.mentorUserId, t.startsAt),
    index("bookings_aspirant_starts_idx").on(t.aspirantUserId, t.startsAt),
    index("bookings_status_idx").on(t.status, t.holdExpiresAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    bookingId: uuid()
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    provider: paymentProviderEnum().notNull(),
    providerOrderId: text().notNull(),
    providerPaymentId: text(),
    amountPaise: integer().notNull(),
    refundedPaise: integer().notNull().default(0),
    status: paymentStatusEnum().notNull().default("created"),
    method: text(),
    failureReason: text(),
    capturedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("payments_provider_order_uq").on(t.provider, t.providerOrderId),
    uniqueIndex("payments_provider_payment_uq").on(t.provider, t.providerPaymentId),
    index("payments_booking_idx").on(t.bookingId),
  ],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid()
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    amountPaise: integer().notNull(),
    providerRefundId: text(),
    status: refundStatusEnum().notNull().default("pending"),
    reason: text().notNull(),
    failureReason: text(),
    ...timestamps,
  },
  (t) => [index("refunds_payment_idx").on(t.paymentId)],
);

/** Every webhook received, keyed by the provider's event id so retries are ignored. */
export const webhookEvents = pgTable("webhook_events", {
  id: text().primaryKey(),
  provider: paymentProviderEnum().notNull(),
  type: text().notNull(),
  payload: jsonb().notNull(),
  processedAt: timestamp({ withTimezone: true }),
  error: text(),
  receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  aspirant: one(users, { fields: [bookings.aspirantUserId], references: [users.id] }),
  mentor: one(mentorProfiles, {
    fields: [bookings.mentorUserId],
    references: [mentorProfiles.userId],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  refunds: many(refunds),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, { fields: [refunds.paymentId], references: [payments.id] }),
}));
