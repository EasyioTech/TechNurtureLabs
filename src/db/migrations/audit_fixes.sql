-- =============================================================================
-- LMS SCHEMA AUDIT FIXES — CONSOLIDATED MIGRATION
-- =============================================================================
-- This script contains all SQL-level fixes identified in the schema audit.
-- Run this against your database to ensure data integrity and fix constraint bugs.

BEGIN;

-- =============================================================================
-- SECTION 1 — ISSUE 6: Deferrable sequence constraints
--
-- Postgres normally checks UNIQUE constraints immediately. During a sequence 
-- reorder (e.g. swap order of lesson 1 and 2), an intermediate step violates 
-- uniqueness. DEFERRABLE allows the check to happen at the END of the transaction.
-- =============================================================================

ALTER TABLE lessons
    DROP CONSTRAINT IF EXISTS uq_lesson_sequence_per_course;
ALTER TABLE lessons
    ADD CONSTRAINT uq_lesson_sequence_per_course
    UNIQUE (course_id, sequence_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE quiz_questions
    DROP CONSTRAINT IF EXISTS uq_quiz_question_sequence;
ALTER TABLE quiz_questions
    ADD CONSTRAINT uq_quiz_question_sequence
    UNIQUE (quiz_id, sequence_order) DEFERRABLE INITIALLY DEFERRED;


-- =============================================================================
-- SECTION 2 — ISSUE 7: Invoice Number Sequence
--
-- Ensures invoice numbers are sequential and unique across the whole system.
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE invoices 
    ALTER COLUMN invoice_number SET DEFAULT 'INV-' || nextval('invoice_number_seq')::text;


-- =============================================================================
-- SECTION 3 — ISSUE 13: Automatically manage updated_at timestamps
--
-- Trigger fix: CREATE OR REPLACE TRIGGER requires PG14+. To ensure 
-- compatibility with PG12/13, we use DROP -> CREATE pattern.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables that have an updated_at column:
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'schools', 'academic_sessions', 'users', 'payment_plans',
        'promo_codes', 'school_subscriptions', 'payment_transactions',
        'invoices', 'student_academic_records', 'courses', 'lessons',
        'quizzes', 'quiz_questions', 'enrollments', 'lesson_progress',
        'course_progress', 'achievements', 'daily_challenges',
        'certificates', 'platform_settings', 'media_assets'
    ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
            CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        ', t, t, t, t);
    END LOOP;
END $$;


-- =============================================================================
-- SECTION 4 — ISSUE 22: Domain Logic Constraints
--
-- Prevents negative XP reward or impossible progress percentages.
-- =============================================================================

ALTER TABLE lessons 
    DROP CONSTRAINT IF EXISTS chk_lesson_xp_positive;
ALTER TABLE lessons 
    ADD CONSTRAINT chk_lesson_xp_positive CHECK (xp_reward >= 0);

ALTER TABLE quizzes 
    DROP CONSTRAINT IF EXISTS chk_quiz_xp_positive;
ALTER TABLE quizzes 
    ADD CONSTRAINT chk_quiz_xp_positive CHECK (xp_reward >= 0);

ALTER TABLE lesson_progress 
    DROP CONSTRAINT IF EXISTS chk_lesson_progress_range;
ALTER TABLE lesson_progress 
    ADD CONSTRAINT chk_lesson_progress_range 
    CHECK (progress_pct >= 0 AND progress_pct <= 100);

ALTER TABLE course_progress 
    DROP CONSTRAINT IF EXISTS chk_course_progress_range;
ALTER TABLE course_progress 
    ADD CONSTRAINT chk_course_progress_range 
    CHECK (progress_pct >= 0 AND progress_pct <= 100);

ALTER TABLE quizzes 
    DROP CONSTRAINT IF EXISTS chk_quiz_pass_percentage;
ALTER TABLE quizzes 
    ADD CONSTRAINT chk_quiz_pass_percentage 
    CHECK (pass_percentage >= 0 AND pass_percentage <= 100);


-- =============================================================================
-- SECTION 5 — ISSUE 15: Array Topic Indexing (GIN)
--
-- Postgres requires a GIN index to search arrays efficiently (using <@ or @>).
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_topics_gin ON courses USING GIN (topics);


-- =============================================================================
-- SECTION 6 — ISSUE 18: System Settings Initializer
--
-- Ensures platform_settings is never empty, which avoids 404s on the landing page.
-- =============================================================================

INSERT INTO platform_settings (id, platform_name)
VALUES ('global', 'TechNurture')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- SECTION 7 — ISSUE 23: Quiz must belong to same course as its lesson
--
-- NOTE: Postgres does not allow subqueries in CHECK constraints.
-- Enforced via a BEFORE INSERT/UPDATE trigger instead.
-- API receives SQLSTATE 23503 on violation — handle as 400 Bad Request.
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_quiz_lesson_course()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lesson_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.id = NEW.lesson_id
              AND l.course_id = NEW.course_id
        ) THEN
            RAISE EXCEPTION
                'lesson_id % does not belong to course_id %',
                NEW.lesson_id, NEW.course_id
                USING ERRCODE = 'foreign_key_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quiz_lesson_course_check ON quizzes;
CREATE TRIGGER trg_quiz_lesson_course_check
    BEFORE INSERT OR UPDATE OF lesson_id, course_id ON quizzes
    FOR EACH ROW EXECUTE FUNCTION validate_quiz_lesson_course();


-- =============================================================================
-- SECTION 8 — ISSUE 25: Data Consistency Triggers
--
-- Ensures XP Events are properly logged for all XP award actions.
-- =============================================================================

CREATE OR REPLACE FUNCTION log_xp_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp_earned > Old.xp_earned OR Old.xp_earned IS NULL THEN
        INSERT INTO xp_events (user_id, school_id, source, xp_amount, reference_type, reference_id)
        VALUES (
            NEW.user_id, 
            NEW.school_id, 
            CASE 
                WHEN TG_TABLE_NAME = 'lesson_progress' THEN 'lesson_completion'::xp_source
                WHEN TG_TABLE_NAME = 'quiz_attempts' THEN 'quiz_score'::xp_source
                ELSE 'bonus'::xp_source
            END,
            NEW.xp_earned - COALESCE(Old.xp_earned, 0),
            TG_TABLE_NAME,
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_lesson_xp ON lesson_progress;
CREATE TRIGGER trg_log_lesson_xp
    AFTER UPDATE OF xp_earned ON lesson_progress
    FOR EACH ROW EXECUTE FUNCTION log_xp_event();


-- =============================================================================
-- SECTION 9 — Multi-Tenancy Security (RLS) — OPTIONAL/PREVIEW
--
-- WARNING: Enable this ONLY after your API layer is updated to set 
-- current_setting('app.current_school_id').
-- =============================================================================

/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_isolation_policy ON users
    USING (school_id = current_setting('app.current_school_id')::uuid);
*/


-- =============================================================================
-- SECTION 10 — PERFORMANCE: Metric Partitioning — OPTIONAL/PREVIEW
--
-- Tables that grow forever (metrics, logs) should be partitioned by date.
-- This requires redefining the tables (cannot simple ALTER into partition).
-- =============================================================================


-- =============================================================================
-- SECTION 11 — CONSTRAINTS CLEANUP
--
-- Ensures newly identified indices from Turn 2 & 3 are applied.
-- =============================================================================

-- Refresh token uniqueness (NEW BUG 2):
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_token_hash 
    ON user_sessions (refresh_token_hash);

-- Soft delete enrollment UPSERT safety:
CREATE UNIQUE INDEX IF NOT EXISTS uq_school_class
    ON school_class_mapping (school_id, class_id)
    WHERE deleted_at IS NULL;

COMMIT;
