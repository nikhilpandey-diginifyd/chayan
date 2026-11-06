CREATE TYPE "public"."payout_method" AS ENUM('bank', 'upi');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'on_hold');--> statement-breakpoint
CREATE TABLE "mentor_payout_accounts" (
	"mentor_user_id" uuid PRIMARY KEY NOT NULL,
	"method" "payout_method" NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_number_enc" text,
	"account_number_last4" text,
	"ifsc" text,
	"upi_id_enc" text,
	"upi_id_masked" text,
	"pan_enc" text NOT NULL,
	"pan_last4" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"gross_paise" integer NOT NULL,
	"platform_fee_paise" integer NOT NULL,
	"mentor_share_paise" integer NOT NULL,
	CONSTRAINT "payout_items_bookingId_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"gross_paise" integer NOT NULL,
	"platform_fee_paise" integer NOT NULL,
	"mentor_share_paise" integer NOT NULL,
	"tds_paise" integer NOT NULL,
	"net_paise" integer NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"method" "payout_method" NOT NULL,
	"reference" text,
	"note" text,
	"paid_at" timestamp with time zone,
	"paid_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentor_payout_accounts" ADD CONSTRAINT "mentor_payout_accounts_mentor_user_id_mentor_profiles_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."mentor_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_mentor_user_id_mentor_profiles_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."mentor_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_items_payout_idx" ON "payout_items" USING btree ("payout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_mentor_period_uq" ON "payouts" USING btree ("mentor_user_id","period_end");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status","period_end");