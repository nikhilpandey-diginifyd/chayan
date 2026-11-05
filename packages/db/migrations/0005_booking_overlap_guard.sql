-- Last line of defence against double booking: two active bookings for the same
-- mentor can never overlap in time, even if application checks race.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "mentor_user_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" IN ('pending_payment', 'confirmed'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_order_ck" CHECK ("ends_at" > "starts_at");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_price_split_ck"
  CHECK ("platform_fee_paise" + "mentor_earnings_paise" = "price_paise");
