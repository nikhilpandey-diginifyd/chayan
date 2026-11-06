import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./auth";
import { bookings } from "./bookings";
import { mentorProfiles } from "./mentors";

export const payoutMethodEnum = pgEnum("payout_method", ["bank", "upi"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "on_hold"]);

/**
 * Where a mentor is paid. Account numbers, UPI IDs and PAN are stored
 * encrypted (AES-256-GCM); only the last characters are kept in plain text.
 */
export const mentorPayoutAccounts = pgTable("mentor_payout_accounts", {
  mentorUserId: uuid()
    .primaryKey()
    .references(() => mentorProfiles.userId, { onDelete: "cascade" }),
  method: payoutMethodEnum().notNull(),
  accountHolderName: text().notNull(),
  accountNumberEnc: text(),
  accountNumberLast4: text(),
  ifsc: text(),
  upiIdEnc: text(),
  upiIdMasked: text(),
  panEnc: text().notNull(),
  panLast4: text().notNull(),
  ...timestamps,
});

/** One payout per mentor per week. */
export const payouts = pgTable(
  "payouts",
  {
    id: uuid().primaryKey().defaultRandom(),
    mentorUserId: uuid()
      .notNull()
      .references(() => mentorProfiles.userId, { onDelete: "restrict" }),
    periodStart: date({ mode: "string" }).notNull(),
    periodEnd: date({ mode: "string" }).notNull(),
    grossPaise: integer().notNull(),
    platformFeePaise: integer().notNull(),
    mentorSharePaise: integer().notNull(),
    tdsPaise: integer().notNull(),
    netPaise: integer().notNull(),
    status: payoutStatusEnum().notNull().default("pending"),
    method: payoutMethodEnum().notNull(),
    reference: text(),
    note: text(),
    paidAt: timestamp({ withTimezone: true }),
    paidBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("payouts_mentor_period_uq").on(t.mentorUserId, t.periodEnd),
    index("payouts_status_idx").on(t.status, t.periodEnd),
  ],
);

/** The bookings a payout covers. A booking can be paid out only once. */
export const payoutItems = pgTable(
  "payout_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    payoutId: uuid()
      .notNull()
      .references(() => payouts.id, { onDelete: "cascade" }),
    bookingId: uuid()
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "restrict" }),
    grossPaise: integer().notNull(),
    platformFeePaise: integer().notNull(),
    mentorSharePaise: integer().notNull(),
  },
  (t) => [index("payout_items_payout_idx").on(t.payoutId)],
);

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  mentor: one(mentorProfiles, {
    fields: [payouts.mentorUserId],
    references: [mentorProfiles.userId],
  }),
  items: many(payoutItems),
}));

export const payoutItemsRelations = relations(payoutItems, ({ one }) => ({
  payout: one(payouts, { fields: [payoutItems.payoutId], references: [payouts.id] }),
  booking: one(bookings, { fields: [payoutItems.bookingId], references: [bookings.id] }),
}));
