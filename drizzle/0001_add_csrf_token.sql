-- CRITICAL FIX: Add CSRF token hash column to user_sessions
-- This column was missing from the database but is required by the auth system
-- Generated: 2026-04-06

-- Add the csrf_token_hash column to user_sessions table
ALTER TABLE "user_sessions"
ADD COLUMN IF NOT EXISTS "csrf_token_hash" text NOT NULL DEFAULT '';

-- Set NOT NULL constraint after populating (since existing rows need a default)
-- For existing sessions, use a placeholder value
UPDATE "user_sessions"
SET "csrf_token_hash" = md5(random()::text || clock_timestamp()::text)
WHERE "csrf_token_hash" = '';

-- Now enforce NOT NULL if you want (optional - default empty string is safe too)
-- This line can be omitted if you prefer to allow NULL for backward compatibility
ALTER TABLE "user_sessions"
ALTER COLUMN "csrf_token_hash" SET NOT NULL;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions' AND column_name = 'csrf_token_hash';
