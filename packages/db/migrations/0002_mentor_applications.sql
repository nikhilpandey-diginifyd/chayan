CREATE TYPE "public"."mentor_application_status" AS ENUM('draft', 'submitted', 'changes_requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mentor_badge" AS ENUM('selected', 'interview_appeared', 'mains_qualified', 'tier2_qualified', 'subject_expert');--> statement-breakpoint
CREATE TYPE "public"."mentor_document_kind" AS ENUM('result_proof', 'marksheet', 'id_proof', 'pan_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."mentor_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "mentor_application_status" DEFAULT 'draft' NOT NULL,
	"phone" text,
	"city" text,
	"state" text,
	"exam_id" uuid,
	"claimed_badge" "mentor_badge",
	"exam_year" integer,
	"rank" text,
	"roll_number" text,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"bio" text,
	"intro_video_url" text,
	"in_government_service" boolean,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_applications_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"kind" "mentor_document_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_documents_storageKey_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"exam_id" uuid NOT NULL,
	"badge" "mentor_badge" NOT NULL,
	"exam_year" integer NOT NULL,
	"rank" text,
	"languages" text[] NOT NULL,
	"bio" text NOT NULL,
	"status" "mentor_status" DEFAULT 'active' NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_documents" ADD CONSTRAINT "mentor_documents_application_id_mentor_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."mentor_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "mentor_applications_status_idx" ON "mentor_applications" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "mentor_documents_application_idx" ON "mentor_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "mentor_profiles_exam_idx" ON "mentor_profiles" USING btree ("exam_id","status");