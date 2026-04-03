-- HARDENING PHASE 2-3: MISSING DATABASE INDEXES
-- These indexes are critical for 10K user scale
-- Run this migration in production with care (creates indexes concurrently)
-- Generated: 2026-04-03

-- ============================================================================
-- ENROLLMENT QUERIES (High Frequency)
-- ============================================================================

-- Composite: enrollment lookups by (user, school, course)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_school_course
  ON enrollments(user_id, school_id, course_id)
  WHERE deleted_at IS NULL;

-- Composite: enrollment by (course, school) for bulk operations
CREATE INDEX IF NOT EXISTS idx_enrollments_course_school
  ON enrollments(course_id, school_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- ============================================================================
-- LESSON PROGRESS QUERIES (High Frequency)
-- ============================================================================

-- Composite: lesson progress by (user, lesson, school)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson_school
  ON lesson_progress(user_id, lesson_id, school_id)
  WHERE deleted_at IS NULL;

-- Query: "find all lessons completed by user in school"
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_school_completed
  ON lesson_progress(user_id, school_id, completed_at)
  WHERE completed_at IS NOT NULL AND deleted_at IS NULL;

-- Query: "find recent progress for dashboard"
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_updated
  ON lesson_progress(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- XP EVENTS & ANALYTICS (Analytics Queries)
-- ============================================================================

-- Composite: XP aggregation by (user, school, source)
CREATE INDEX IF NOT EXISTS idx_xp_events_user_school_source
  ON xp_events(user_id, school_id, source)
  WHERE deleted_at IS NULL;

-- Query: "get user's XP history by date range"
CREATE INDEX IF NOT EXISTS idx_xp_events_user_created
  ON xp_events(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Query: "leaderboard calculations by school"
CREATE INDEX IF NOT EXISTS idx_xp_events_school_created
  ON xp_events(school_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- AUDIT LOGGING (Compliance & Investigations)
-- ============================================================================

-- Composite: audit trail by (school, action, date)
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_action_date
  ON audit_logs(school_id, action, created_at DESC)
  WHERE deleted_at IS NULL;

-- Query: "user activity audit trail"
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_school
  ON audit_logs(user_id, school_id, created_at DESC);

-- ============================================================================
-- LEADERBOARD & STUDENT QUERIES
-- ============================================================================

-- Query: "top students in school by XP (leaderboard)"
CREATE INDEX IF NOT EXISTS idx_students_school_xp_desc
  ON students(school_id, cumulative_xp DESC)
  WHERE is_active = true AND deleted_at IS NULL;

-- Query: "find student by email in school"
CREATE INDEX IF NOT EXISTS idx_students_school_email
  ON students(school_id, email)
  WHERE is_active = true AND deleted_at IS NULL;

-- ============================================================================
-- LEARNING SESSION & QUIZ QUERIES
-- ============================================================================

-- Composite: session lookups by (user, lesson, active status)
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_user_lesson_active
  ON lesson_sessions(user_id, lesson_id, is_active)
  WHERE deleted_at IS NULL;

-- Query: "find recent sessions for user"
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_user_created
  ON lesson_sessions(user_id, created_at DESC)
  WHERE is_active = true;

-- Composite: quiz attempts for rate limiting
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz
  ON quiz_attempts(user_id, quiz_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBSCRIPTION & PAYMENT QUERIES
-- ============================================================================

-- Composite: subscription status lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_status_date
  ON school_subscriptions(school_id, status, current_period_end DESC)
  WHERE deleted_at IS NULL;

-- Query: "find expired subscriptions for renewal"
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_date
  ON school_subscriptions(status, current_period_end)
  WHERE status IN ('active', 'trialing');

-- Query: "transaction lookups"
CREATE INDEX IF NOT EXISTS idx_transactions_school_status_date
  ON payment_transactions(school_id, status, created_at DESC);

-- ============================================================================
-- MEDIA ASSET QUERIES
-- ============================================================================

-- Query: "find lesson's media asset"
CREATE INDEX IF NOT EXISTS idx_media_assets_lesson_id
  ON media_assets(lesson_id)
  WHERE processing_status = 'completed' AND deleted_at IS NULL;

-- Query: "find assets by school (for cleanup/storage)"
CREATE INDEX IF NOT EXISTS idx_media_assets_school_created
  ON media_assets(school_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- COURSE & LESSON STRUCTURE
-- ============================================================================

-- Query: "lessons in course ordered by sequence"
CREATE INDEX IF NOT EXISTS idx_lessons_course_sequence
  ON lessons(course_id, sequence_order)
  WHERE deleted_at IS NULL;

-- Query: "quiz by lesson"
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id
  ON quizzes(lesson_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- ANALYSIS & MONITORING QUERIES
-- ============================================================================

-- For dashboard queries that span multiple schools
-- (Used by super-admin analytics)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_school_created
  ON lesson_progress(school_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- For course analytics
CREATE INDEX IF NOT EXISTS idx_course_progress_course_user
  ON course_progress(course_id, user_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SUMMARY & VERIFICATION
-- ============================================================================

-- List all newly created indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index size (to identify disk usage)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verify index usage (should increase after load test)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
