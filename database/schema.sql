-- ============================================================================
-- B2B SaaS Gamified Learning Management System — PostgreSQL Schema
-- Production-ready · Multi-tenant · Razorpay · DPDP-compliant
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. APPLICATION ROLE
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'technurture_app') THEN
    CREATE ROLE technurture_app WITH LOGIN PASSWORD 'technurture_secure_pass';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE orchids TO technurture_app;
GRANT ALL ON SCHEMA public TO technurture_app;

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'student');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');
CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE lesson_content_type AS ENUM ('video', 'ppt', 'pdf', 'quiz');
CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'fill_blank', 'multi_select');
CREATE TYPE xp_source AS ENUM ('lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment');
CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'void', 'overdue');
CREATE TYPE storage_type AS ENUM ('r2', 'local');
CREATE TYPE asset_type AS ENUM ('video', 'image', 'document');

-- ============================================================================
-- 2. CORE TENANT TABLES
-- ============================================================================

-- 2a. Schools (top-level tenant)
CREATE TABLE schools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            CITEXT NOT NULL UNIQUE,
    email           CITEXT NOT NULL,
    phone           TEXT,
    address         TEXT,
    city            TEXT,
    state           TEXT,
    country         TEXT NOT NULL DEFAULT 'IN',
    pincode         TEXT,
    logo_url        TEXT,
    website         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    data_processing_consent     BOOLEAN NOT NULL DEFAULT FALSE,
    minor_data_guardian_consent  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- 2b. Academic sessions
CREATE TABLE academic_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_session_dates CHECK (end_date > start_date)
);

-- Enforce single current session per school
CREATE UNIQUE INDEX uq_school_current_session
    ON academic_sessions (school_id) WHERE is_current = TRUE AND deleted_at IS NULL;

-- ============================================================================
-- 3. USER SYSTEM (unified table)
-- ============================================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID REFERENCES schools(id) ON DELETE CASCADE,
    role                user_role NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    email               CITEXT NOT NULL,
    password_hash       TEXT NOT NULL,
    phone               TEXT,
    avatar_url          TEXT,
    date_of_birth       DATE,
    is_minor            BOOLEAN NOT NULL DEFAULT FALSE,
    guardian_name       TEXT,
    guardian_email      CITEXT,
    guardian_consent    BOOLEAN NOT NULL DEFAULT FALSE,
    cumulative_xp       BIGINT NOT NULL DEFAULT 0,
    current_streak      INT NOT NULL DEFAULT 0,
    longest_streak      INT NOT NULL DEFAULT 0,
    last_active_at      TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_school_required_for_non_super
        CHECK (role = 'super_admin' OR school_id IS NOT NULL),
    CONSTRAINT chk_minor_guardian
        CHECK (is_minor = FALSE OR (guardian_name IS NOT NULL AND guardian_email IS NOT NULL))
);

-- Case-insensitive unique email (active users only)
CREATE UNIQUE INDEX uq_users_email_active ON users (email) WHERE deleted_at IS NULL;

-- ============================================================================
-- 4. PAYMENT & SUBSCRIPTION
-- ============================================================================

-- 4a. Payment plans (catalogue managed by Super Admin)
CREATE TABLE payment_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    billing_cycle   billing_cycle NOT NULL,
    price           NUMERIC(12,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'INR',
    max_students    INT,
    features        JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    trial_days      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_price_positive CHECK (price >= 0),
    CONSTRAINT chk_trial_days_positive CHECK (trial_days >= 0)
);

-- 4b. School subscriptions
CREATE TABLE school_subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    plan_id             UUID NOT NULL REFERENCES payment_plans(id) ON DELETE RESTRICT,
    status              subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end  TIMESTAMPTZ NOT NULL,
    trial_start         TIMESTAMPTZ,
    trial_end           TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       TEXT,
    auto_renew          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_period_dates CHECK (current_period_end > current_period_start)
);

-- Enforce single active/trialing subscription per school
CREATE UNIQUE INDEX uq_school_active_subscription
    ON school_subscriptions (school_id)
    WHERE status IN ('active', 'trialing');

-- 4c. Payment transactions (Razorpay-compatible)
CREATE TABLE payment_transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id               UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    subscription_id         UUID NOT NULL REFERENCES school_subscriptions(id) ON DELETE RESTRICT,
    razorpay_order_id       TEXT,
    razorpay_payment_id     TEXT,
    razorpay_signature      TEXT,
    amount                  NUMERIC(12,2) NOT NULL,
    currency                TEXT NOT NULL DEFAULT 'INR',
    status                  payment_status NOT NULL DEFAULT 'created',
    gateway_response        JSONB,
    failure_reason          TEXT,
    refund_amount           NUMERIC(12,2),
    refunded_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_refund_amount CHECK (refund_amount IS NULL OR (refund_amount > 0 AND refund_amount <= amount))
);

CREATE UNIQUE INDEX uq_razorpay_payment_id ON payment_transactions (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX uq_razorpay_order_id ON payment_transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- 4d. Invoices
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    subscription_id     UUID NOT NULL REFERENCES school_subscriptions(id) ON DELETE RESTRICT,
    transaction_id      UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    invoice_number      TEXT NOT NULL UNIQUE,
    status              invoice_status NOT NULL DEFAULT 'draft',
    subtotal            NUMERIC(12,2) NOT NULL,
    tax_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    total               NUMERIC(12,2) NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'INR',
    issued_at           TIMESTAMPTZ,
    due_date            DATE,
    paid_at             TIMESTAMPTZ,
    billing_name        TEXT NOT NULL,
    billing_address     TEXT,
    gstin               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_invoice_totals CHECK (total = subtotal + tax_amount),
    CONSTRAINT chk_subtotal_positive CHECK (subtotal >= 0)
);

-- ============================================================================
-- 5. ACADEMIC STRUCTURE
-- ============================================================================

-- 5a. Grades (system-wide, normalised)
CREATE TABLE grades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    level       INT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5b. School-grade mapping (which grades a school offers)
CREATE TABLE school_grade_mapping (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    grade_id    UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_grade UNIQUE (school_id, grade_id)
);

-- 5c. Student academic records (per session — promotion creates new row)
CREATE TABLE student_academic_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    grade_id        UUID NOT NULL REFERENCES grades(id) ON DELETE RESTRICT,
    roll_number     TEXT,
    section         TEXT,
    is_promoted     BOOLEAN NOT NULL DEFAULT FALSE,
    promoted_at     TIMESTAMPTZ,
    promoted_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_session UNIQUE (user_id, session_id)
);

-- ============================================================================
-- 6. CONTENT SYSTEM
-- ============================================================================

-- 6a. Courses
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            CITEXT NOT NULL UNIQUE,
    description     TEXT,
    thumbnail_url   TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    all_grades     BOOLEAN NOT NULL DEFAULT FALSE,
    total_lessons   INT NOT NULL DEFAULT 0,
    total_xp        INT NOT NULL DEFAULT 0,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- 6b. Course-grade mapping
CREATE TABLE course_grade_mapping (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    grade_id    UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_grade UNIQUE (course_id, grade_id)
);

-- 6c. Lessons
CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    content_type    lesson_content_type NOT NULL,
    content_url     TEXT,
    sequence_order  INT NOT NULL,
    duration_minutes INT,
    xp_reward       INT NOT NULL DEFAULT 10,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_sequence_positive CHECK (sequence_order > 0),
    CONSTRAINT chk_xp_reward_positive CHECK (xp_reward >= 0)
);

-- Prevent duplicate sequence within a course
CREATE UNIQUE INDEX uq_lesson_sequence_per_course
    ON lessons (course_id, sequence_order) WHERE deleted_at IS NULL;

-- 6d. Quizzes
CREATE TABLE quizzes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    time_limit_secs INT,
    pass_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    max_attempts    INT NOT NULL DEFAULT 3,
    xp_reward       INT NOT NULL DEFAULT 20,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_pass_pct CHECK (pass_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_max_attempts CHECK (max_attempts > 0),
    CONSTRAINT chk_quiz_xp CHECK (xp_reward >= 0)
);

-- 6e. Quiz questions
CREATE TABLE quiz_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   question_type NOT NULL,
    options         JSONB NOT NULL DEFAULT '[]',
    correct_answer  JSONB NOT NULL,
    explanation     TEXT,
    points          INT NOT NULL DEFAULT 1,
    sequence_order  INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_points_positive CHECK (points > 0),
    CONSTRAINT chk_qq_sequence CHECK (sequence_order > 0)
);

CREATE UNIQUE INDEX uq_quiz_question_sequence
    ON quiz_questions (quiz_id, sequence_order);

-- ============================================================================
-- 7. ENROLLMENT & PROGRESS
-- ============================================================================

-- 7a. Enrollments
CREATE TABLE enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_enrollment UNIQUE (user_id, course_id, session_id)
);

-- 7b. Lesson progress
CREATE TABLE lesson_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    progress_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    time_spent_secs INT NOT NULL DEFAULT 0,
    xp_earned       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_progress_pct CHECK (progress_pct BETWEEN 0 AND 100),
    CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id, enrollment_id)
);

-- 7c. Course progress (aggregate cache per enrollment)
CREATE TABLE course_progress (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id       UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    lessons_completed   INT NOT NULL DEFAULT 0,
    total_lessons       INT NOT NULL DEFAULT 0,
    progress_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_xp_earned     INT NOT NULL DEFAULT 0,
    total_time_secs     INT NOT NULL DEFAULT 0,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cp_progress CHECK (progress_pct BETWEEN 0 AND 100),
    CONSTRAINT uq_user_course_enrollment UNIQUE (user_id, course_id, enrollment_id)
);

-- 7d. Quiz attempts
CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    attempt_number  INT NOT NULL DEFAULT 1,
    score           NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_score       NUMERIC(5,2) NOT NULL,
    passed          BOOLEAN NOT NULL DEFAULT FALSE,
    answers         JSONB NOT NULL DEFAULT '[]',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    time_taken_secs INT,
    xp_earned       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= max_score),
    CONSTRAINT uq_quiz_attempt UNIQUE (user_id, quiz_id, enrollment_id, attempt_number)
);

-- ============================================================================
-- 8. GAMIFICATION
-- ============================================================================

-- 8a. XP event ledger (append-only, source of truth)
CREATE TABLE xp_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    source          xp_source NOT NULL,
    xp_amount       INT NOT NULL,
    reference_type  TEXT,
    reference_id    UUID,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_xp_nonzero CHECK (xp_amount <> 0)
);

-- 8b. Achievements (badge catalogue)
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    icon_url        TEXT,
    tier            achievement_tier NOT NULL DEFAULT 'bronze',
    xp_threshold    INT,
    criteria         JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8c. User achievements
CREATE TABLE user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

-- 8d. Daily challenges
CREATE TABLE daily_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    xp_reward       INT NOT NULL DEFAULT 5,
    criteria        JSONB NOT NULL DEFAULT '{}',
    challenge_date  DATE NOT NULL,
    status          challenge_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_dc_xp CHECK (xp_reward > 0)
);

CREATE UNIQUE INDEX uq_daily_challenge_date ON daily_challenges (challenge_date);

-- 8e. User daily challenges
CREATE TABLE user_daily_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id    UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    completed_at    TIMESTAMPTZ,
    xp_earned       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_daily_challenge UNIQUE (user_id, challenge_id)
);

-- ============================================================================
-- 9. CERTIFICATION
-- ============================================================================

-- 9a. Certificate templates
CREATE TABLE certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    template_url    TEXT,
    min_progress_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    min_quiz_score  NUMERIC(5,2),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cert_progress CHECK (min_progress_pct BETWEEN 0 AND 100)
);

-- 9b. Issued certificates
CREATE TABLE user_certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_id  UUID NOT NULL REFERENCES certificates(id) ON DELETE RESTRICT,
    enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    certificate_url TEXT,
    verification_code TEXT NOT NULL UNIQUE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_cert_enrollment UNIQUE (user_id, certificate_id, enrollment_id)
);

-- ============================================================================
-- 10. ANALYTICS SUPPORT
-- ============================================================================

CREATE TABLE platform_metrics_daily (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date         DATE NOT NULL UNIQUE,
    total_schools       INT NOT NULL DEFAULT 0,
    active_schools      INT NOT NULL DEFAULT 0,
    total_students      INT NOT NULL DEFAULT 0,
    active_students     INT NOT NULL DEFAULT 0,
    total_enrollments   INT NOT NULL DEFAULT 0,
    total_xp_awarded    BIGINT NOT NULL DEFAULT 0,
    revenue_total       NUMERIC(14,2) NOT NULL DEFAULT 0,
    new_subscriptions   INT NOT NULL DEFAULT 0,
    churned_subscriptions INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE school_metrics_daily (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    metric_date         DATE NOT NULL,
    active_students     INT NOT NULL DEFAULT 0,
    total_lessons_completed INT NOT NULL DEFAULT 0,
    total_quizzes_taken INT NOT NULL DEFAULT 0,
    avg_quiz_score      NUMERIC(5,2),
    total_xp_awarded    BIGINT NOT NULL DEFAULT 0,
    avg_session_minutes NUMERIC(8,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_metric_date UNIQUE (school_id, metric_date)
);

CREATE TABLE course_metrics_daily (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    metric_date         DATE NOT NULL,
    total_enrollments   INT NOT NULL DEFAULT 0,
    active_learners     INT NOT NULL DEFAULT 0,
    completions         INT NOT NULL DEFAULT 0,
    avg_progress_pct    NUMERIC(5,2),
    avg_quiz_score      NUMERIC(5,2),
    total_xp_awarded    BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_metric_date UNIQUE (course_id, metric_date)
);

-- ============================================================================
-- 11. AUDIT & SECURITY
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    school_id       UUID REFERENCES schools(id) ON DELETE SET NULL,
    action          audit_action NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE login_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address      INET NOT NULL,
    user_agent      TEXT,
    success         BOOLEAN NOT NULL,
    failure_reason  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_prt_expiry CHECK (expires_at > created_at)
);

CREATE TABLE email_verification_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_evt_expiry CHECK (expires_at > created_at)
);

-- ============================================================================
-- 11b. MEDIA LIBRARY (Cloudflare R2 / local fallback)
-- ============================================================================

CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name       TEXT NOT NULL,          -- UUID-based storage key/filename
    original_name   TEXT NOT NULL,          -- Original filename from the user
    file_url        TEXT NOT NULL,          -- Public URL (R2 or /api/media/...)
    file_path       TEXT NOT NULL,          -- Storage key (R2) or relative local path
    mime_type       TEXT NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    storage_type    storage_type NOT NULL DEFAULT 'local',
    asset_type      asset_type NOT NULL DEFAULT 'document',
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_asset_type ON media_assets (asset_type);
CREATE INDEX idx_media_uploaded_by ON media_assets (uploaded_by);
CREATE INDEX idx_media_created ON media_assets (created_at);

-- ============================================================================
-- 12. INDEXES
-- ============================================================================

-- Schools
CREATE INDEX idx_schools_is_active ON schools (is_active) WHERE deleted_at IS NULL;

-- Academic sessions
CREATE INDEX idx_academic_sessions_school ON academic_sessions (school_id);

-- Users
CREATE INDEX idx_users_school ON users (school_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users (role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_school_role ON users (school_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_cumulative_xp ON users (cumulative_xp DESC) WHERE deleted_at IS NULL AND role = 'student';
CREATE INDEX idx_users_school_xp ON users (school_id, cumulative_xp DESC) WHERE deleted_at IS NULL AND role = 'student';
CREATE INDEX idx_users_created_at ON users (created_at);

-- Subscriptions
CREATE INDEX idx_subscriptions_school ON school_subscriptions (school_id);
CREATE INDEX idx_subscriptions_status ON school_subscriptions (status);
CREATE INDEX idx_subscriptions_period_end ON school_subscriptions (current_period_end);

-- Payment transactions
CREATE INDEX idx_transactions_school ON payment_transactions (school_id);
CREATE INDEX idx_transactions_subscription ON payment_transactions (subscription_id);
CREATE INDEX idx_transactions_status ON payment_transactions (status);
CREATE INDEX idx_transactions_created ON payment_transactions (created_at);

-- Invoices
CREATE INDEX idx_invoices_school ON invoices (school_id);
CREATE INDEX idx_invoices_status ON invoices (status);

-- Student academic records
CREATE INDEX idx_sar_user ON student_academic_records (user_id);
CREATE INDEX idx_sar_school_session ON student_academic_records (school_id, session_id);
CREATE INDEX idx_sar_grade ON student_academic_records (grade_id);

-- Courses
CREATE INDEX idx_courses_published ON courses (is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_created_at ON courses (created_at);

-- Course-grade mapping
CREATE INDEX idx_cgm_grade ON course_grade_mapping (grade_id);

-- Lessons
CREATE INDEX idx_lessons_course ON lessons (course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_content_type ON lessons (content_type);

-- Quizzes
CREATE INDEX idx_quizzes_course ON quizzes (course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quizzes_lesson ON quizzes (lesson_id) WHERE deleted_at IS NULL;

-- Quiz questions
CREATE INDEX idx_qq_quiz ON quiz_questions (quiz_id);

-- Enrollments
CREATE INDEX idx_enrollments_user ON enrollments (user_id);
CREATE INDEX idx_enrollments_course ON enrollments (course_id);
CREATE INDEX idx_enrollments_school ON enrollments (school_id);
CREATE INDEX idx_enrollments_session ON enrollments (session_id);
CREATE INDEX idx_enrollments_school_course ON enrollments (school_id, course_id);

-- Lesson progress
CREATE INDEX idx_lp_user ON lesson_progress (user_id);
CREATE INDEX idx_lp_lesson ON lesson_progress (lesson_id);
CREATE INDEX idx_lp_enrollment ON lesson_progress (enrollment_id);

-- Course progress
CREATE INDEX idx_cp_user ON course_progress (user_id);
CREATE INDEX idx_cp_course ON course_progress (course_id);
CREATE INDEX idx_cp_enrollment ON course_progress (enrollment_id);

-- Quiz attempts
CREATE INDEX idx_qa_user ON quiz_attempts (user_id);
CREATE INDEX idx_qa_quiz ON quiz_attempts (quiz_id);
CREATE INDEX idx_qa_enrollment ON quiz_attempts (enrollment_id);

-- XP events (critical for leaderboard sync)
CREATE INDEX idx_xp_user ON xp_events (user_id);
CREATE INDEX idx_xp_school ON xp_events (school_id);
CREATE INDEX idx_xp_source ON xp_events (source);
CREATE INDEX idx_xp_created ON xp_events (created_at);
CREATE INDEX idx_xp_user_created ON xp_events (user_id, created_at DESC);
CREATE INDEX idx_xp_school_created ON xp_events (school_id, created_at DESC);
CREATE INDEX idx_xp_reference ON xp_events (reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- User achievements
CREATE INDEX idx_ua_user ON user_achievements (user_id);
CREATE INDEX idx_ua_achievement ON user_achievements (achievement_id);

-- Daily challenges
CREATE INDEX idx_dc_date ON daily_challenges (challenge_date);
CREATE INDEX idx_dc_status ON daily_challenges (status);

-- User daily challenges
CREATE INDEX idx_udc_user ON user_daily_challenges (user_id);

-- Certificates
CREATE INDEX idx_certs_course ON certificates (course_id);

-- User certificates
CREATE INDEX idx_ucerts_user ON user_certificates (user_id);
CREATE INDEX idx_ucerts_verification ON user_certificates (verification_code);

-- Analytics
CREATE INDEX idx_pmd_date ON platform_metrics_daily (metric_date);
CREATE INDEX idx_smd_school_date ON school_metrics_daily (school_id, metric_date);
CREATE INDEX idx_cmd_course_date ON course_metrics_daily (course_id, metric_date);

-- Audit logs
CREATE INDEX idx_audit_user ON audit_logs (user_id);
CREATE INDEX idx_audit_school ON audit_logs (school_id);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs (action);
CREATE INDEX idx_audit_created ON audit_logs (created_at);

-- Login attempts
CREATE INDEX idx_login_email ON login_attempts (email);
CREATE INDEX idx_login_user ON login_attempts (user_id);
CREATE INDEX idx_login_ip ON login_attempts (ip_address);
CREATE INDEX idx_login_created ON login_attempts (created_at);

-- Password reset tokens
CREATE INDEX idx_prt_user ON password_reset_tokens (user_id);
CREATE INDEX idx_prt_expires ON password_reset_tokens (expires_at);

-- Email verification tokens
CREATE INDEX idx_evt_user ON email_verification_tokens (user_id);
CREATE INDEX idx_evt_expires ON email_verification_tokens (expires_at);

-- ============================================================================
-- 13. TRIGGER: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'schools', 'academic_sessions', 'users', 'payment_plans',
            'school_subscriptions', 'payment_transactions', 'invoices',
            'student_academic_records', 'courses', 'lessons', 'quizzes',
            'quiz_questions', 'enrollments', 'lesson_progress',
            'course_progress', 'daily_challenges', 'certificates'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================================
-- 14. TRIGGER: sync cumulative_xp on users from xp_events insert
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_sync_user_xp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET cumulative_xp = cumulative_xp + NEW.xp_amount,
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_xp_event_sync
    AFTER INSERT ON xp_events
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_user_xp();

-- ============================================================================
-- 15. PRODUCTION SEED DATA
-- ============================================================================

-- Super Admin user (Platform Owner)
-- Default credentials: admin@technurture.com / admin123  (Change immediately in production!)
INSERT INTO users (id, role, first_name, last_name, email, password_hash)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'super_admin',
    'Platform',
    'Admin',
    'admin@technurture.com',
    crypt('admin123', gen_salt('bf', 10))
) ON CONFLICT (id) DO NOTHING;

-- Default payment plan (Required for school registration flow to work smoothly)
INSERT INTO payment_plans (id, name, description, billing_cycle, price, max_students, trial_days)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Starter Plan',
    'Ideal for small schools to get started (up to 200 students)',
    'annual',
    49999.00,
    200,
    14
) ON CONFLICT (id) DO NOTHING;

-- Base Grades System
INSERT INTO grades (id, name, level) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Class 1', 1),
    ('f0000000-0000-0000-0000-000000000002', 'Class 2', 2),
    ('f0000000-0000-0000-0000-000000000003', 'Class 3', 3),
    ('f0000000-0000-0000-0000-000000000004', 'Class 4', 4),
    ('f0000000-0000-0000-0000-000000000005', 'Class 5', 5),
    ('f0000000-0000-0000-0000-000000000006', 'Class 6', 6),
    ('f0000000-0000-0000-0000-000000000007', 'Class 7', 7),
    ('f0000000-0000-0000-0000-000000000008', 'Class 8', 8),
    ('f0000000-0000-0000-0000-000000000009', 'Class 9', 9),
    ('f0000000-0000-0000-0000-000000000010', 'Class 10', 10),
    ('f0000000-0000-0000-0000-000000000011', 'Class 11', 11),
    ('f0000000-0000-0000-0000-000000000012', 'Class 12', 12)
ON CONFLICT (level) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO technurture_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO technurture_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO technurture_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO technurture_app;

COMMIT;
