ALTER TYPE "public"."audit_action" ADD VALUE 'backup';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'restore';--> statement-breakpoint
ALTER TYPE "public"."user_type" ADD VALUE 'system';--> statement-breakpoint
CREATE TABLE "school_backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint NOT NULL,
	"hash" text,
	"student_count" integer,
	"revenue_total" numeric(12, 2),
	"records_count" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "school_backups_file_name_unique" UNIQUE("file_name")
);
--> statement-breakpoint
ALTER TABLE "lesson_submissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lesson_submissions" CASCADE;--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "content_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."lesson_content_type";--> statement-breakpoint
CREATE TYPE "public"."lesson_content_type" AS ENUM('video', 'ppt', 'pdf', 'quiz');--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "content_type" SET DATA TYPE "public"."lesson_content_type" USING "content_type"::"public"."lesson_content_type";--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "storage_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "storage_type" SET DEFAULT 'r2'::text;--> statement-breakpoint
DROP TYPE "public"."storage_type";--> statement-breakpoint
CREATE TYPE "public"."storage_type" AS ENUM('r2', 'cloudflare_stream');--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "storage_type" SET DEFAULT 'r2'::"public"."storage_type";--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "storage_type" SET DATA TYPE "public"."storage_type" USING "storage_type"::"public"."storage_type";--> statement-breakpoint
DROP INDEX "uq_course_class";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "content_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "file_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD COLUMN "school_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "school_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "csrf_token_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "school_backups" ADD CONSTRAINT "school_backups_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_backups_school" ON "school_backups" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_backups_timestamp" ON "school_backups" USING btree ("timestamp");--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sessions_school" ON "lesson_sessions" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lesson_sequence_per_course" ON "lessons" USING btree ("course_id","sequence_order") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_login_ip" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_media_school" ON "media_assets" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_razorpay_order" ON "payment_transactions" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "idx_pin_reset_student_status" ON "pin_reset_requests" USING btree ("student_id","status");--> statement-breakpoint
ALTER TABLE "pin_reset_requests" DROP COLUMN "new_pin";--> statement-breakpoint
ALTER TABLE "course_class_mapping" ADD CONSTRAINT "uq_course_class" UNIQUE("course_id","class_id");--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quiz_pass_percentage_range" CHECK ("quizzes"."pass_percentage" >= 0 AND "quizzes"."pass_percentage" <= 100);--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quiz_time_limit_positive" CHECK ("quizzes"."time_limit_secs" > 0 OR "quizzes"."time_limit_secs" IS NULL);--> statement-breakpoint
DROP TYPE "public"."user_role";