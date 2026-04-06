-- CRITICAL FIX: Add school_id column to media_assets table
-- This column was missing from the database but is required for multi-tenancy enforcement
-- Generated: 2026-04-06

-- Add the school_id column to media_assets table
ALTER TABLE "media_assets"
ADD COLUMN IF NOT EXISTS "school_id" uuid;

-- For existing assets, assign to the first school as default
-- This ensures existing media doesn't break the foreign key constraint
UPDATE "media_assets"
SET "school_id" = (SELECT id FROM schools LIMIT 1)
WHERE "school_id" IS NULL;

-- Now enforce NOT NULL constraint
ALTER TABLE "media_assets"
ALTER COLUMN "school_id" SET NOT NULL;

-- Add foreign key constraint to maintain referential integrity
-- Cascade delete ensures orphaned assets are cleaned up if school is deleted
ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_school_id_fk"
FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE;

-- Add index for query performance when filtering by school
CREATE INDEX IF NOT EXISTS "idx_media_school_id" ON "media_assets"("school_id");

-- Verify the column exists with correct properties
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'media_assets' AND column_name = 'school_id';
