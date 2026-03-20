-- =============================================================================
-- Migration 0003: Security & Performance Fixes
-- =============================================================================

-- 1. GIN index on courses.topics array for fast multi-topic filtering.
--    Without this, every topic filter does a sequential scan.
--    "WHERE 'math' = ANY(topics)" goes from O(n) to O(log n).
CREATE INDEX IF NOT EXISTS idx_courses_topics_gin
    ON courses USING GIN (topics);

-- 2. Unique partial index: only one active academic session per school.
--    Prevents the scenario where two sessions are marked is_current=true
--    simultaneously, which corrupts enrollment and analytics queries.
CREATE UNIQUE INDEX IF NOT EXISTS uq_school_one_current_session
    ON academic_sessions (school_id)
    WHERE is_current = true AND deleted_at IS NULL;

-- 3. Remove the duplicate plain index on lesson_sessions.session_token.
--    The .unique() call in the schema already creates a unique index;
--    the explicit index() was a duplicate — double write overhead.
DROP INDEX IF EXISTS idx_sessions_token;

-- 4. Ensure lesson_submissions.status only accepts known values.
--    The column was plain text with no constraint — any string could be stored.
ALTER TABLE lesson_submissions
    DROP CONSTRAINT IF EXISTS chk_submission_status;

ALTER TABLE lesson_submissions
    ADD CONSTRAINT chk_submission_status
    CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected'));
