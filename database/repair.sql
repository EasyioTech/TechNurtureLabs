-- Add missing columns to lesson_progress
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS verified_watch_seconds integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_watched boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_page_viewed integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS slides_viewed_array jsonb NOT NULL DEFAULT '[]';

-- Add index to lesson_progress
CREATE INDEX IF NOT EXISTS idx_lp_content_watched ON lesson_progress (content_watched);

-- Create missing lesson_sessions table
CREATE TABLE IF NOT EXISTS "lesson_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE cascade,
	"lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE cascade,
	"session_token" text NOT NULL UNIQUE,
	"device_hash" text,
	"user_agent" text,
	"ip_hash" text,
	"last_nonce" bigint DEFAULT 0 NOT NULL,
	"ip_address" inet,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_playback_time" integer DEFAULT 0 NOT NULL,
	"total_verified_seconds" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Add indexes to lesson_sessions
CREATE INDEX IF NOT EXISTS "idx_sessions_user_lesson" ON "lesson_sessions" ("user_id", "lesson_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "lesson_sessions" ("session_token");
CREATE INDEX IF NOT EXISTS "idx_sessions_active" ON "lesson_sessions" ("is_active");
