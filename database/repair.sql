-- ============================================================================
-- TechNurture Labs - Database Repair Script
-- Purpose: Sync the existing DB schema (from manual SQL) with the Drizzle schema.
-- ============================================================================

BEGIN;

-- 1. Rename 'grades' to 'classes' if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'grades') THEN
        ALTER TABLE grades RENAME TO classes;
    END IF;
END $$;

-- 2. Update 'student_academic_records'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_academic_records' AND column_name='grade_id') THEN
        ALTER TABLE student_academic_records RENAME COLUMN grade_id TO class_id;
    END IF;
END $$;

-- 3. Update 'course_grade_mapping'
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'course_grade_mapping') THEN
        ALTER TABLE course_grade_mapping RENAME TO course_class_mapping;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_class_mapping' AND column_name='grade_id') THEN
        ALTER TABLE course_class_mapping RENAME COLUMN grade_id TO class_id;
    END IF;
END $$;

-- 4. Update 'school_grade_mapping'
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'school_grade_mapping') THEN
        ALTER TABLE school_grade_mapping RENAME TO school_class_mapping;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_class_mapping' AND column_name='grade_id') THEN
        ALTER TABLE school_class_mapping RENAME COLUMN grade_id TO class_id;
    END IF;
END $$;

-- 5. Fix 'courses' table columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='all_grades') THEN
        ALTER TABLE courses RENAME COLUMN all_grades TO all_classes;
    END IF;
END $$;

-- 6. Add 'promo_codes' table if missing (it was added in recent turns to Drizzle but might be missing in DB)
CREATE TABLE IF NOT EXISTS promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT NOT NULL UNIQUE,
    discount_type   TEXT NOT NULL, -- 'percentage', 'fixed'
    discount_value  NUMERIC(12,2) NOT NULL,
    max_uses        INT,
    current_uses    INT NOT NULL DEFAULT 0,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Add missing columns to 'school_subscriptions' and 'payment_transactions'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_subscriptions' AND column_name='promo_code_id') THEN
        ALTER TABLE school_subscriptions ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_transactions' AND column_name='promo_code_id') THEN
        ALTER TABLE payment_transactions ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_plans' AND column_name='is_popular') THEN
        ALTER TABLE payment_plans ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- 8. Add 'platform_settings' table if missing
CREATE TABLE IF NOT EXISTS platform_settings (
    id              TEXT PRIMARY KEY,
    hero_video_url  TEXT NOT NULL DEFAULT '',
    hero_video_type TEXT NOT NULL DEFAULT 'youtube',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Seed global settings if missing
INSERT INTO platform_settings (id, hero_video_url, hero_video_type)
VALUES ('global', '', 'youtube')
ON CONFLICT (id) DO NOTHING;

-- 10. Fix missing school-class mappings (Optional safety net)
-- If a school has no classes mapped, give them all available classes
INSERT INTO school_class_mapping (school_id, class_id)
SELECT s.id, c.id
FROM schools s, classes c
WHERE NOT EXISTS (SELECT 1 FROM school_class_mapping WHERE school_id = s.id)
ON CONFLICT DO NOTHING;

COMMIT;
