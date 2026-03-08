CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"device_info" text,
	"ip_address" "inet",
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "uq_lesson_sequence_per_course";--> statement-breakpoint
DROP INDEX "uq_quiz_question_sequence";--> statement-breakpoint
DROP INDEX "uq_users_email_active";--> statement-breakpoint
DROP INDEX "uq_course_class";--> statement-breakpoint
DROP INDEX "uq_enrollment";--> statement-breakpoint
DROP INDEX "uq_school_class";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "ip_address" SET DATA TYPE inet USING ip_address::inet;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "topics" SET DATA TYPE text[] USING topics::text[];--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "topics" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "login_attempts" ALTER COLUMN "ip_address" SET DATA TYPE inet USING ip_address::inet;--> statement-breakpoint
ALTER TABLE "academic_sessions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_class_mapping" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "course_class_mapping" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_progress" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "course_progress" ADD COLUMN "school_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "school_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "folder" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "favicon_url" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "logo_layout" text DEFAULT 'horizontal' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "show_platform_name" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "logo_height" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD COLUMN "time_limit_secs" integer;--> statement-breakpoint
ALTER TABLE "school_class_mapping" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cp_session" ON "course_progress" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_cp_school" ON "course_progress" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_courses_active_published" ON "courses" USING btree ("is_published") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_evt_token" ON "email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_evt_user" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_enroll_user_active" ON "enrollments" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_lp_session" ON "lesson_progress" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_lp_school" ON "lesson_progress" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_lessons_active" ON "lessons" USING btree ("course_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_lessons_course_published" ON "lessons" USING btree ("course_id","is_published");--> statement-breakpoint
CREATE INDEX "idx_prt_token" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_prt_user" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prt_expires" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_qattempts_quiz" ON "quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "idx_qattempts_user" ON "quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_school_one_active_sub" ON "school_subscriptions" USING btree ("school_id") WHERE status IN ('active', 'trialing');--> statement-breakpoint
CREATE INDEX "idx_sub_school_status" ON "school_subscriptions" USING btree ("school_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email_per_school" ON "users" USING btree ("email","school_id") WHERE school_id IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email_global" ON "users" USING btree ("email") WHERE school_id IS NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("school_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_school_active" ON "users" USING btree ("school_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_xp_user_created" ON "xp_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_course_class" ON "course_class_mapping" USING btree ("course_id","class_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_enrollment" ON "enrollments" USING btree ("user_id","course_id","session_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_school_class" ON "school_class_mapping" USING btree ("school_id","class_id") WHERE deleted_at IS NULL;--> statement-breakpoint
ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."lesson_content_type";--> statement-breakpoint
CREATE TYPE "public"."lesson_content_type" AS ENUM('video', 'ppt', 'pdf');--> statement-breakpoint
ALTER TABLE "public"."lessons" ALTER COLUMN "content_type" SET DATA TYPE "public"."lesson_content_type" USING "content_type"::"public"."lesson_content_type";