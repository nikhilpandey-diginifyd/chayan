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
  "no_show_mentor",
  "no_show_aspirant",
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

    // Video session (Phase 6)
    videoRoomId: text(),
    mentorFirstJoinedAt: timestamp({ withTimezone: true }),
    aspirantFirstJoinedAt: timestamp({ withTimezone: true }),
    mentorLastSeenAt: timestamp({ withTimezone: true }),
    aspirantLastSeenAt: timestamp({ withTimezone: true }),
    roomEndedAt: timestamp({ withTimezone: true }),
    finalizedAt: timestamp({ withTimezone: true }),
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

/** Files shared during a session, such as photos of answer copies. */
export const bookingAttachments = pgTable(
  "booking_attachments",
  {
    id: uuid().primaryKey().defaultRandom(),
    bookingId: uuid()
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    uploadedBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text().notNull().unique(),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_attachments_booking_idx").on(t.bookingId, t.createdAt)],
);

/** Lease-based lock so only one server runs scheduled work at a time. */
export const jobLocks = pgTable("job_locks", {
  name: text().primaryKey(),
  lockedUntil: timestamp({ withTimezone: true }).notNull(),
  lastRunAt: timestamp({ withTimezone: true }),
});

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  aspirant: one(users, { fields: [bookings.aspirantUserId], references: [users.id] }),
  mentor: one(mentorProfiles, {
    fields: [bookings.mentorUserId],
    references: [mentorProfiles.userId],
  }),
  payments: many(payments),
  attachments: many(bookingAttachments),
}));

export const bookingAttachmentsRelations = relations(bookingAttachments, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAttachments.bookingId], references: [bookings.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  refunds: many(refunds),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, { fields: [refunds.paymentId], references: [payments.id] }),
}));
