CREATE TYPE "public"."achievement_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE "public"."asset_type" AS ENUM('video', 'image', 'document');
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion');
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'quarterly', 'semi_annual', 'annual');
CREATE TYPE "public"."challenge_status" AS ENUM('active', 'completed', 'expired');
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'void', 'overdue');
CREATE TYPE "public"."lesson_content_type" AS ENUM('video', 'ppt', 'pdf', 'quiz', 'assignment');
CREATE TYPE "public"."payment_status" AS ENUM('created', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'true_false', 'fill_blank', 'multi_select');
CREATE TYPE "public"."storage_type" AS ENUM('r2', 'local');
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'cancelled', 'expired');
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'school_admin', 'student');
CREATE TYPE "public"."user_type" AS ENUM('super_admin', 'school_admin', 'student');
CREATE TYPE "public"."xp_source" AS ENUM('lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment');
CREATE TABLE "academic_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"tier" "achievement_tier" DEFAULT 'bronze' NOT NULL,
	"category" text DEFAULT 'Beginner' NOT NULL,
	"xp_threshold" integer,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_name_unique" UNIQUE("name")
);

CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_type" "user_type",
	"school_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"template_url" text,
	"min_progress_pct" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"min_quiz_score" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_name_unique" UNIQUE("name"),
	CONSTRAINT "classes_level_unique" UNIQUE("level")
);

CREATE TABLE "course_class_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "course_metrics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"total_enrollments" integer DEFAULT 0 NOT NULL,
	"active_learners" integer DEFAULT 0 NOT NULL,
	"completions" integer DEFAULT 0 NOT NULL,
	"avg_progress_pct" numeric(5, 2),
	"avg_quiz_score" numeric(5, 2),
	"total_xp_awarded" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "course_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"progress_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_xp_earned" integer DEFAULT 0 NOT NULL,
	"total_time_secs" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"all_classes" boolean DEFAULT false NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);

CREATE TABLE "daily_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"xp_reward" integer DEFAULT 5 NOT NULL,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"challenge_date" date NOT NULL,
	"status" "challenge_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_type" "user_type" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"transaction_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"issued_at" timestamp with time zone,
	"due_date" date,
	"paid_at" timestamp with time zone,
	"billing_name" text NOT NULL,
	"billing_address" text,
	"gstin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);

CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"progress_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"last_position_secs" integer DEFAULT 0 NOT NULL,
	"time_spent_secs" integer DEFAULT 0 NOT NULL,
	"verified_watch_seconds" integer DEFAULT 0 NOT NULL,
	"content_watched" boolean DEFAULT false NOT NULL,
	"completion_locked" boolean DEFAULT false NOT NULL,
	"max_page_viewed" integer DEFAULT 0 NOT NULL,
	"slides_viewed_array" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lp_progress_pct_range" CHECK ("lesson_progress"."progress_pct" >= 0 AND "lesson_progress"."progress_pct" <= 100)
);

CREATE TABLE "lesson_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"device_hash" text,
	"user_agent" text,
	"ip_hash" text,
	"last_nonce" bigint DEFAULT 0 NOT NULL,
	"ip_address" "inet",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_playback_time" integer DEFAULT 0 NOT NULL,
	"total_verified_seconds" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "lesson_sessions_session_token_unique" UNIQUE("session_token")
);

CREATE TABLE "lesson_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"feedback" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" bigint DEFAULT 0 NOT NULL,
	"storage_type" "storage_type" DEFAULT 'local' NOT NULL,
	"asset_type" "asset_type" DEFAULT 'document' NOT NULL,
	"uploaded_by" uuid,
	"folder" text,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content_type" "lesson_content_type" NOT NULL,
	"content_url" text,
	"sequence_order" integer NOT NULL,
	"duration_minutes" integer,
	"xp_reward" integer DEFAULT 10 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"asset_id" uuid REFERENCES "media_assets"("id")
);

CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"user_type" "user_type",
	"ip_address" "inet" NOT NULL,
	"user_agent" text,
	"success" boolean NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_type" "user_type" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"billing_cycle" "billing_cycle" NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"max_students" integer,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "payment_plans_name_unique" UNIQUE("name")
);

CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"promo_code_id" uuid,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"gateway_response" jsonb,
	"failure_reason" text,
	"refund_amount" numeric(12, 2),
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "platform_metrics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_date" date NOT NULL,
	"total_schools" integer DEFAULT 0 NOT NULL,
	"active_schools" integer DEFAULT 0 NOT NULL,
	"total_students" integer DEFAULT 0 NOT NULL,
	"active_students" integer DEFAULT 0 NOT NULL,
	"total_enrollments" integer DEFAULT 0 NOT NULL,
	"total_xp_awarded" bigint DEFAULT 0 NOT NULL,
	"revenue_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"new_subscriptions" integer DEFAULT 0 NOT NULL,
	"churned_subscriptions" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_metrics_daily_metric_date_unique" UNIQUE("metric_date")
);

CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"platform_name" text DEFAULT 'TechNurture' NOT NULL,
	"logo_layout" text DEFAULT 'horizontal' NOT NULL,
	"show_platform_name" boolean DEFAULT true NOT NULL,
	"logo_height" integer DEFAULT 40 NOT NULL,
	"hero_video_url" text DEFAULT '' NOT NULL,
	"hero_video_type" text DEFAULT 'youtube' NOT NULL,
	"support_email" text,
	"currency_default" text DEFAULT 'INR' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);

CREATE TABLE "quiz_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"option_id" uuid,
	"text_answer" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quiz_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"max_score" numeric(5, 2) NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"time_taken_secs" integer,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sequence_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"time_limit_secs" integer,
	"sequence_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"time_limit_secs" integer,
	"pass_percentage" numeric(5, 2) DEFAULT '60.00' NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"xp_reward" integer DEFAULT 20 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "school_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "school_class_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "school_metrics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"active_students" integer DEFAULT 0 NOT NULL,
	"total_lessons_completed" integer DEFAULT 0 NOT NULL,
	"total_quizzes_taken" integer DEFAULT 0 NOT NULL,
	"avg_quiz_score" numeric(5, 2),
	"total_xp_awarded" bigint DEFAULT 0 NOT NULL,
	"avg_session_minutes" numeric(8, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "school_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"promo_code_id" uuid,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'IN' NOT NULL,
	"pincode" text,
	"logo_url" text,
	"website" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"data_processing_consent" boolean DEFAULT false NOT NULL,
	"minor_data_guardian_consent" boolean DEFAULT false NOT NULL,
	"udise_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "schools_slug_unique" UNIQUE("slug")
);

CREATE TABLE "student_academic_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"roll_number" text,
	"section" text,
	"is_promoted" boolean DEFAULT false NOT NULL,
	"promoted_at" timestamp with time zone,
	"promoted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"bio" text,
	"date_of_birth" date,
	"gender" text,
	"is_minor" boolean DEFAULT false NOT NULL,
	"guardian_name" text,
	"guardian_email" text,
	"guardian_consent" boolean DEFAULT false NOT NULL,
	"cumulative_xp" bigint DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "super_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_backup_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "super_admins_email_unique" UNIQUE("email")
);

CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "user_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"certificate_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"certificate_url" text,
	"verification_code" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_certificates_verification_code_unique" UNIQUE("verification_code")
);

CREATE TABLE "user_daily_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_type" "user_type" NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"device_info" text,
	"ip_address" "inet",
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);

CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"source" "xp_source" NOT NULL,
	"xp_amount" integer NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_class_mapping" ADD CONSTRAINT "course_class_mapping_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_class_mapping" ADD CONSTRAINT "course_class_mapping_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_metrics_daily" ADD CONSTRAINT "course_metrics_daily_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_super_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."super_admins"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_school_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."school_subscriptions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_submissions" ADD CONSTRAINT "lesson_submissions_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_submissions" ADD CONSTRAINT "lesson_submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_submissions" ADD CONSTRAINT "lesson_submissions_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_school_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."school_subscriptions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_option_id_quiz_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."quiz_options"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_admins" ADD CONSTRAINT "school_admins_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_class_mapping" ADD CONSTRAINT "school_class_mapping_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_class_mapping" ADD CONSTRAINT "school_class_mapping_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_metrics_daily" ADD CONSTRAINT "school_metrics_daily_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_plan_id_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "student_academic_records" ADD CONSTRAINT "student_academic_records_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_academic_records" ADD CONSTRAINT "student_academic_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_academic_records" ADD CONSTRAINT "student_academic_records_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "student_academic_records" ADD CONSTRAINT "student_academic_records_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "student_academic_records" ADD CONSTRAINT "student_academic_records_promoted_by_school_admins_id_fk" FOREIGN KEY ("promoted_by") REFERENCES "public"."school_admins"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "user_daily_challenges" ADD CONSTRAINT "user_daily_challenges_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_daily_challenges" ADD CONSTRAINT "user_daily_challenges_challenge_id_daily_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."daily_challenges"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_students_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");
CREATE INDEX "idx_audit_created" ON "audit_logs" USING btree ("created_at");
CREATE UNIQUE INDEX "uq_course_class" ON "course_class_mapping" USING btree ("course_id","class_id") WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX "uq_course_metric_date" ON "course_metrics_daily" USING btree ("course_id","metric_date");
CREATE UNIQUE INDEX "uq_user_course_enrollment" ON "course_progress" USING btree ("user_id","course_id","enrollment_id");
CREATE INDEX "idx_cp_session" ON "course_progress" USING btree ("session_id");
CREATE INDEX "idx_cp_school" ON "course_progress" USING btree ("school_id");
CREATE INDEX "idx_courses_published" ON "courses" USING btree ("is_published");
CREATE INDEX "idx_courses_active_published" ON "courses" USING btree ("is_published") WHERE deleted_at IS NULL;
CREATE INDEX "idx_daily_challenge_date" ON "daily_challenges" USING btree ("challenge_date");
CREATE UNIQUE INDEX "uq_daily_challenge_item" ON "daily_challenges" USING btree ("challenge_date","title");
CREATE INDEX "idx_evt_token" ON "email_verification_tokens" USING btree ("token_hash");
CREATE INDEX "idx_evt_user" ON "email_verification_tokens" USING btree ("user_id");
CREATE UNIQUE INDEX "uq_enrollment" ON "enrollments" USING btree ("user_id","course_id","session_id") WHERE deleted_at IS NULL;
CREATE INDEX "idx_enrollments_school" ON "enrollments" USING btree ("school_id");
CREATE INDEX "idx_enroll_user_active" ON "enrollments" USING btree ("user_id","is_active");
CREATE UNIQUE INDEX "uq_user_lesson" ON "lesson_progress" USING btree ("user_id","lesson_id","enrollment_id");
CREATE INDEX "idx_lp_user" ON "lesson_progress" USING btree ("user_id");
CREATE INDEX "idx_lp_enrollment" ON "lesson_progress" USING btree ("enrollment_id");
CREATE INDEX "idx_lp_session" ON "lesson_progress" USING btree ("session_id");
CREATE INDEX "idx_lp_school" ON "lesson_progress" USING btree ("school_id");
CREATE INDEX "idx_lp_content_watched" ON "lesson_progress" USING btree ("content_watched");
CREATE INDEX "idx_sessions_user_lesson" ON "lesson_sessions" USING btree ("user_id","lesson_id");
CREATE INDEX "idx_sessions_token" ON "lesson_sessions" USING btree ("session_token");
CREATE INDEX "idx_sessions_active" ON "lesson_sessions" USING btree ("is_active");
CREATE INDEX "idx_submission_user_lesson" ON "lesson_submissions" USING btree ("user_id","lesson_id");
CREATE INDEX "idx_lessons_course" ON "lessons" USING btree ("course_id");
CREATE INDEX "idx_lessons_active" ON "lessons" USING btree ("course_id") WHERE deleted_at IS NULL;
CREATE INDEX "idx_lessons_course_published" ON "lessons" USING btree ("course_id","is_published");
CREATE INDEX "idx_login_email" ON "login_attempts" USING btree ("email");
CREATE INDEX "idx_login_created" ON "login_attempts" USING btree ("created_at");
CREATE INDEX "idx_media_asset_type" ON "media_assets" USING btree ("asset_type");
CREATE INDEX "idx_media_uploaded_by" ON "media_assets" USING btree ("uploaded_by");
CREATE INDEX "idx_media_created" ON "media_assets" USING btree ("created_at");
CREATE INDEX "idx_prt_token" ON "password_reset_tokens" USING btree ("token_hash");
CREATE INDEX "idx_prt_user" ON "password_reset_tokens" USING btree ("user_id");
CREATE INDEX "idx_prt_expires" ON "password_reset_tokens" USING btree ("expires_at");
CREATE INDEX "idx_transactions_school" ON "payment_transactions" USING btree ("school_id");
CREATE INDEX "idx_transactions_status" ON "payment_transactions" USING btree ("status");
CREATE INDEX "idx_qa_answers_attempt" ON "quiz_attempt_answers" USING btree ("attempt_id");
CREATE INDEX "idx_qattempts_user" ON "quiz_attempts" USING btree ("user_id");
CREATE INDEX "idx_quiz_options_question" ON "quiz_options" USING btree ("question_id");
CREATE INDEX "idx_quiz_questions_quiz" ON "quiz_questions" USING btree ("quiz_id");
CREATE UNIQUE INDEX "uq_school_admins_email" ON "school_admins" USING btree ("email") WHERE deleted_at IS NULL;
CREATE INDEX "idx_school_admins_school" ON "school_admins" USING btree ("school_id");
CREATE UNIQUE INDEX "uq_school_class" ON "school_class_mapping" USING btree ("school_id","class_id") WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX "uq_school_metric_date" ON "school_metrics_daily" USING btree ("school_id","metric_date");
CREATE INDEX "idx_subscriptions_school" ON "school_subscriptions" USING btree ("school_id");
CREATE INDEX "idx_subscriptions_status" ON "school_subscriptions" USING btree ("status");
CREATE UNIQUE INDEX "uq_school_one_active_sub" ON "school_subscriptions" USING btree ("school_id") WHERE status IN ('active', 'trialing');
CREATE INDEX "idx_sub_school_status" ON "school_subscriptions" USING btree ("school_id","status");
CREATE UNIQUE INDEX "uq_student_session" ON "student_academic_records" USING btree ("user_id","session_id");
CREATE INDEX "idx_sar_school_session" ON "student_academic_records" USING btree ("school_id","session_id");
CREATE UNIQUE INDEX "uq_students_email" ON "students" USING btree ("email") WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX "uq_students_phone" ON "students" USING btree ("phone") WHERE deleted_at IS NULL;
CREATE INDEX "idx_students_school" ON "students" USING btree ("school_id");
CREATE INDEX "idx_students_xp" ON "students" USING btree ("cumulative_xp");
CREATE UNIQUE INDEX "uq_user_achievement" ON "user_achievements" USING btree ("user_id","achievement_id");
CREATE UNIQUE INDEX "uq_user_cert_enrollment" ON "user_certificates" USING btree ("user_id","certificate_id","enrollment_id");
CREATE UNIQUE INDEX "uq_user_daily_challenge" ON "user_daily_challenges" USING btree ("user_id","challenge_id");
CREATE INDEX "idx_sessions_user" ON "user_sessions" USING btree ("user_id");
CREATE INDEX "idx_sessions_expires" ON "user_sessions" USING btree ("expires_at");
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "user_sessions" USING btree ("refresh_token_hash");
CREATE INDEX "idx_xp_user" ON "xp_events" USING btree ("user_id");
CREATE INDEX "idx_xp_school" ON "xp_events" USING btree ("school_id");
CREATE INDEX "idx_xp_created" ON "xp_events" USING btree ("created_at");
CREATE INDEX "idx_xp_user_created" ON "xp_events" USING btree ("user_id","created_at");
