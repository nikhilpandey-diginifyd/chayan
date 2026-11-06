CREATE TYPE "public"."paper_language" AS ENUM('english', 'hindi', 'bilingual');--> statement-breakpoint
CREATE TABLE "paper_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'paper' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"youtube_id" text NOT NULL,
	"description" text,
	"topic" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prep_videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pyq_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"language" "paper_language" NOT NULL,
	"description" text,
	"source_url" text,
	"storage_key" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"answer_key_storage_key" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pyq_papers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pyq_papers_storageKey_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "paper_downloads" ADD CONSTRAINT "paper_downloads_paper_id_pyq_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."pyq_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_downloads" ADD CONSTRAINT "paper_downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prep_videos" ADD CONSTRAINT "prep_videos_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pyq_papers" ADD CONSTRAINT "pyq_papers_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pyq_papers" ADD CONSTRAINT "pyq_papers_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paper_downloads_user_idx" ON "paper_downloads" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "prep_videos_exam_idx" ON "prep_videos" USING btree ("exam_id","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "pyq_papers_exam_year_idx" ON "pyq_papers" USING btree ("exam_id","year","is_published");