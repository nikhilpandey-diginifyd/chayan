import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const emailDeliveryStatusEnum = pgEnum("email_delivery_status", [
  "sent",
  "failed",
  "logged",
]);

/** One row per transactional email attempt. Used to show send failures and for support. */
export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: uuid().primaryKey().defaultRandom(),
    toEmail: text().notNull(),
    subject: text().notNull(),
    status: emailDeliveryStatusEnum().notNull(),
    providerMessageId: text(),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("email_deliveries_to_idx").on(t.toEmail, t.createdAt),
    index("email_deliveries_status_idx").on(t.status, t.createdAt),
  ],
);
