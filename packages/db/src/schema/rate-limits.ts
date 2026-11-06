import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Fixed-window counters for app-level rate limits (uploads, bookings, joins). */
export const appRateLimits = pgTable("app_rate_limits", {
  key: text().primaryKey(),
  count: integer().notNull(),
  windowStart: timestamp({ withTimezone: true }).notNull(),
});
