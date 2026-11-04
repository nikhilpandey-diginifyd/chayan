CREATE TYPE "public"."email_delivery_status" AS ENUM('sent', 'failed', 'logged');--> statement-breakpoint
CREATE TABLE "mentor_availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	CONSTRAINT "mentor_availability_weekday_ck" CHECK ("mentor_availability_rules"."weekday" between 0 and 6),
	CONSTRAINT "mentor_availability_range_ck" CHECK ("mentor_availability_rules"."start_minute" >= 0 and "mentor_availability_rules"."end_minute" <= 1440 and "mentor_availability_rules"."start_minute" < "mentor_availability_rules"."end_minute")
);
--> statement-breakpoint
CREATE TABLE "mentor_blocked_dates" (
	"mentor_user_id" uuid NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "mentor_blocked_dates_mentor_user_id_date_pk" PRIMARY KEY("mentor_user_id","date")
);
--> statement-breakpoint
CREATE TABLE "mentor_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_paise" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_services_duration_ck" CHECK ("mentor_services"."duration_minutes" in (15, 30, 60)),
	CONSTRAINT "mentor_services_price_ck" CHECK ("mentor_services"."price_paise" between 9900 and 999900)
);
--> statement-breakpoint
CREATE TABLE "email_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"status" "email_delivery_status" NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "mentor_profiles_exam_idx";--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "photo_key" text;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "focus_areas" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "stage_codes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "buffer_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "min_notice_hours" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD COLUMN "booking_window_days" integer DEFAULT 14 NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor_availability_rules" ADD CONSTRAINT "mentor_availability_rules_mentor_user_id_mentor_profiles_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."mentor_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_blocked_dates" ADD CONSTRAINT "mentor_blocked_dates_mentor_user_id_mentor_profiles_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."mentor_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_services" ADD CONSTRAINT "mentor_services_mentor_user_id_mentor_profiles_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."mentor_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_availability_mentor_idx" ON "mentor_availability_rules" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_services_mentor_duration_uq" ON "mentor_services" USING btree ("mentor_user_id","duration_minutes");--> statement-breakpoint
CREATE INDEX "email_deliveries_to_idx" ON "email_deliveries" USING btree ("to_email","created_at");--> statement-breakpoint
CREATE INDEX "email_deliveries_status_idx" ON "email_deliveries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "mentor_profiles_exam_idx" ON "mentor_profiles" USING btree ("exam_id","status","is_published");--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_slug_unique" UNIQUE("slug");