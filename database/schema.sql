-- ============================================================================
-- TechNurture LMS — Canonical Production Schema
-- Single source of truth. Auto-applied on first DB init via Docker.
-- Generated: 2026-03-08 | Version: 2.0.0
-- ============================================================================

-- Auto-commit mode: each statement runs independently.
-- IF NOT EXISTS guards make this safe to re-run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ENUM TYPES (idempotent)
-- ============================================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'student'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lesson_content_type AS ENUM ('video', 'ppt', 'pdf'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'fill_blank', 'multi_select'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE xp_source AS ENUM ('lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'void', 'overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE storage_type AS ENUM ('r2', 'local'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE asset_type AS ENUM ('video', 'image', 'document'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE discount_type AS ENUM ('percentage', 'fixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 1. SCHOOLS (top-level tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schools (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT NOT NULL,
    slug                        CITEXT NOT NULL UNIQUE,
    email                       CITEXT NOT NULL,
    phone                       TEXT,
    address                     TEXT,
    city                        TEXT,
    state                       TEXT,
    country                     TEXT NOT NULL DEFAULT 'IN',
    pincode                     TEXT,
    logo_url                    TEXT,
    website                     TEXT,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    udise_code                  TEXT,
    data_processing_consent     BOOLEAN NOT NULL DEFAULT FALSE,
    minor_data_guardian_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ
);

-- ============================================================================
-- 2. ACADEMIC SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS academic_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT chk_session_dates CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_current_session
    ON academic_sessions (school_id) WHERE is_current = TRUE AND deleted_at IS NULL;

-- ============================================================================
-- 3. USERS (unified table — students, admins, super admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id                UUID REFERENCES schools(id) ON DELETE CASCADE,
    role                     user_role NOT NULL,
    first_name               TEXT NOT NULL,
    last_name                TEXT NOT NULL,
    email                    CITEXT NOT NULL,
    password_hash            TEXT NOT NULL,
    phone                    TEXT,
    avatar_url               TEXT,
    date_of_birth            DATE,
    is_minor                 BOOLEAN NOT NULL DEFAULT FALSE,
    guardian_name            TEXT,
    guardian_email           CITEXT,
    guardian_consent         BOOLEAN NOT NULL DEFAULT FALSE,
    cumulative_xp            BIGINT NOT NULL DEFAULT 0,
    current_streak           INT NOT NULL DEFAULT 0,
    longest_streak           INT NOT NULL DEFAULT 0,
    last_active_at           TIMESTAMPTZ,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    bio                      TEXT,
    gender                   TEXT,
    email_verified_at        TIMESTAMPTZ,
    two_factor_secret        TEXT,
    two_factor_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_backup_codes  JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    CONSTRAINT chk_school_required_for_non_super
        CHECK (role = 'super_admin' OR school_id IS NOT NULL),
    CONSTRAINT chk_minor_guardian
        CHECK (is_minor = FALSE OR (guardian_name IS NOT NULL AND guardian_email IS NOT NULL))
);

-- Multi-tenant email uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_per_school
    ON users (email, school_id) WHERE school_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_global
    ON users (email) WHERE school_id IS NULL AND deleted_at IS NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_school      ON users (school_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role        ON users (role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_school_role ON users (school_id, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_xp          ON users (cumulative_xp DESC) WHERE deleted_at IS NULL AND role = 'student';
CREATE INDEX IF NOT EXISTS idx_users_school_xp   ON users (school_id, cumulative_xp DESC) WHERE deleted_at IS NULL AND role = 'student';
CREATE INDEX IF NOT EXISTS idx_users_school_active ON users (school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at  ON users (created_at);

-- ============================================================================
-- 4. USER SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  TEXT NOT NULL,
    device_info         TEXT,
    ip_address          INET,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_token_hash ON user_sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions (expires_at);

-- ============================================================================
-- 5. PAYMENT PLANS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    billing_cycle billing_cycle NOT NULL,
    price         NUMERIC(12,2) NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'INR',
    max_students  INT,
    features      JSONB NOT NULL DEFAULT '{}',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    is_popular    BOOLEAN NOT NULL DEFAULT FALSE,
    trial_days    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    CONSTRAINT chk_price_positive CHECK (price >= 0),
    CONSTRAINT chk_trial_days_positive CHECK (trial_days >= 0)
);

-- ============================================================================
-- 6. PROMO CODES
-- ============================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT NOT NULL UNIQUE,
    discount_type   discount_type NOT NULL,
    discount_value  NUMERIC(12,2) NOT NULL,
    max_uses        INT,
    current_uses    INT NOT NULL DEFAULT 0,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. SCHOOL SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS school_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id             UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    plan_id               UUID NOT NULL REFERENCES payment_plans(id) ON DELETE RESTRICT,
    promo_code_id         UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
    status                subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start  TIMESTAMPTZ NOT NULL,
    current_period_end    TIMESTAMPTZ NOT NULL,
    trial_start           TIMESTAMPTZ,
    trial_end             TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    cancel_reason         TEXT,
    auto_renew            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_period_dates CHECK (current_period_end > current_period_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_one_active_sub
    ON school_subscriptions (school_id) WHERE status IN ('active', 'trialing');
CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON school_subscriptions (school_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON school_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_sub_school_status ON school_subscriptions (school_id, status);

-- ============================================================================
-- 8. PAYMENT TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id             UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    subscription_id       UUID NOT NULL REFERENCES school_subscriptions(id) ON DELETE RESTRICT,
    promo_code_id         UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
    razorpay_order_id     TEXT,
    razorpay_payment_id   TEXT,
    razorpay_signature    TEXT,
    amount                NUMERIC(12,2) NOT NULL,
    currency              TEXT NOT NULL DEFAULT 'INR',
    status                payment_status NOT NULL DEFAULT 'created',
    gateway_response      JSONB,
    failure_reason        TEXT,
    refund_amount         NUMERIC(12,2),
    refunded_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_refund_amount CHECK (refund_amount IS NULL OR (refund_amount > 0 AND refund_amount <= amount))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_razorpay_payment_id ON payment_transactions (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_razorpay_order_id ON payment_transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_school ON payment_transactions (school_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON payment_transactions (created_at);

-- ============================================================================
-- 9. INVOICES
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1000 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS invoices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id        UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    subscription_id  UUID NOT NULL REFERENCES school_subscriptions(id) ON DELETE RESTRICT,
    transaction_id   UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    invoice_number   TEXT NOT NULL UNIQUE DEFAULT ('INV-' || nextval('invoice_number_seq')::text),
    status           invoice_status NOT NULL DEFAULT 'draft',
    subtotal         NUMERIC(12,2) NOT NULL,
    tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
    total            NUMERIC(12,2) NOT NULL,
    currency         TEXT NOT NULL DEFAULT 'INR',
    issued_at        TIMESTAMPTZ,
    due_date         DATE,
    paid_at          TIMESTAMPTZ,
    billing_name     TEXT NOT NULL,
    billing_address  TEXT,
    gstin            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_invoice_totals CHECK (total = subtotal + tax_amount),
    CONSTRAINT chk_subtotal_positive CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoices_school ON invoices (school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

-- ============================================================================
-- 10. CLASSES (global system-wide)
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    level       INT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- ============================================================================
-- 11. SCHOOL-CLASS MAPPING
-- ============================================================================
CREATE TABLE IF NOT EXISTS school_class_mapping (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_class
    ON school_class_mapping (school_id, class_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 12. STUDENT ACADEMIC RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_academic_records (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id   UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    roll_number  TEXT,
    section      TEXT,
    is_promoted  BOOLEAN NOT NULL DEFAULT FALSE,
    promoted_at  TIMESTAMPTZ,
    promoted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_session UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_sar_user ON student_academic_records (user_id);
CREATE INDEX IF NOT EXISTS idx_sar_school_session ON student_academic_records (school_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sar_class ON student_academic_records (class_id);

-- ============================================================================
-- 13. COURSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            CITEXT NOT NULL UNIQUE,
    description     TEXT,
    thumbnail_url   TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    all_classes     BOOLEAN NOT NULL DEFAULT FALSE,
    total_lessons   INT NOT NULL DEFAULT 0,
    total_xp        INT NOT NULL DEFAULT 0,
    category        TEXT NOT NULL DEFAULT 'General',
    topics          TEXT[] NOT NULL DEFAULT '{}',
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_courses_published  ON courses (is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses (created_at);
CREATE INDEX IF NOT EXISTS idx_courses_topics_gin ON courses USING GIN (topics);

-- ============================================================================
-- 14. COURSE-CLASS MAPPING
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_class_mapping (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_course_class
    ON course_class_mapping (course_id, class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ccm_class ON course_class_mapping (class_id);

-- ============================================================================
-- 15. LESSONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    content_type     lesson_content_type NOT NULL,
    content_url      TEXT,
    sequence_order   INT NOT NULL,
    duration_minutes INT,
    xp_reward        INT NOT NULL DEFAULT 10,
    is_published     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT chk_sequence_positive CHECK (sequence_order > 0),
    CONSTRAINT chk_xp_reward_positive CHECK (xp_reward >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_sequence_per_course
    ON lessons (course_id, sequence_order) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons (course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_course_published ON lessons (course_id, is_published);

-- ============================================================================
-- 16. QUIZZES
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id        UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    time_limit_secs  INT,
    pass_percentage  NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    max_attempts     INT NOT NULL DEFAULT 3,
    xp_reward        INT NOT NULL DEFAULT 20,
    is_published     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT chk_pass_pct CHECK (pass_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_max_attempts CHECK (max_attempts > 0),
    CONSTRAINT chk_quiz_xp CHECK (xp_reward >= 0)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes (course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes (lesson_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 17. QUIZ QUESTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   question_type NOT NULL,
    options         JSONB NOT NULL DEFAULT '[]',
    correct_answer  JSONB NOT NULL,
    explanation     TEXT,
    points          INT NOT NULL DEFAULT 1,
    sequence_order  INT NOT NULL,
    time_limit_secs INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_points_positive CHECK (points > 0),
    CONSTRAINT chk_qq_sequence CHECK (sequence_order > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_question_sequence
    ON quiz_questions (quiz_id, sequence_order) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX IF NOT EXISTS idx_qq_quiz ON quiz_questions (quiz_id);

-- ============================================================================
-- 18. ENROLLMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id   UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollment
    ON enrollments (user_id, course_id, session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school ON enrollments (school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON enrollments (session_id);
CREATE INDEX IF NOT EXISTS idx_enroll_user_active ON enrollments (user_id, is_active);

-- ============================================================================
-- 19. LESSON PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id    UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    school_id        UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id       UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    progress_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
    time_spent_secs  INT NOT NULL DEFAULT 0,
    xp_earned        INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_lesson_progress_range CHECK (progress_pct BETWEEN 0 AND 100),
    CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_user       ON lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lp_lesson     ON lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lp_enrollment ON lesson_progress (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lp_school     ON lesson_progress (school_id);
CREATE INDEX IF NOT EXISTS idx_lp_session    ON lesson_progress (session_id);

-- ============================================================================
-- 20. COURSE PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_progress (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id        UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE RESTRICT,
    lessons_completed INT NOT NULL DEFAULT 0,
    total_lessons     INT NOT NULL DEFAULT 0,
    progress_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_xp_earned   INT NOT NULL DEFAULT 0,
    total_time_secs   INT NOT NULL DEFAULT 0,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_course_progress_range CHECK (progress_pct BETWEEN 0 AND 100),
    CONSTRAINT uq_user_course_enrollment UNIQUE (user_id, course_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_user       ON course_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_cp_course     ON course_progress (course_id);
CREATE INDEX IF NOT EXISTS idx_cp_school     ON course_progress (school_id);
CREATE INDEX IF NOT EXISTS idx_cp_session    ON course_progress (session_id);
CREATE INDEX IF NOT EXISTS idx_cp_enrollment ON course_progress (enrollment_id);

-- ============================================================================
-- 21. QUIZ ATTEMPTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
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

CREATE INDEX IF NOT EXISTS idx_qattempts_user ON quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_qattempts_quiz ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_qa_enrollment  ON quiz_attempts (enrollment_id);

-- ============================================================================
-- 22. XP EVENTS (ledger — append-only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS xp_events (
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

CREATE INDEX IF NOT EXISTS idx_xp_user          ON xp_events (user_id);
CREATE INDEX IF NOT EXISTS idx_xp_school        ON xp_events (school_id);
CREATE INDEX IF NOT EXISTS idx_xp_user_created  ON xp_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_school_created ON xp_events (school_id, created_at DESC);

-- ============================================================================
-- 23. ACHIEVEMENTS (badge catalogue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL UNIQUE,
    description  TEXT,
    icon_url     TEXT,
    tier         achievement_tier NOT NULL DEFAULT 'bronze',
    xp_threshold INT,
    criteria     JSONB NOT NULL DEFAULT '{}',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements (user_id);

-- ============================================================================
-- 24. DAILY CHALLENGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_challenge_date ON daily_challenges (challenge_date);

CREATE TABLE IF NOT EXISTS user_daily_challenges (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    xp_earned    INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_daily_challenge UNIQUE (user_id, challenge_id)
);

-- ============================================================================
-- 25. CERTIFICATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    template_url     TEXT,
    min_progress_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    min_quiz_score   NUMERIC(5,2),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cert_progress CHECK (min_progress_pct BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS user_certificates (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_id    UUID NOT NULL REFERENCES certificates(id) ON DELETE RESTRICT,
    enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
    certificate_url   TEXT,
    verification_code TEXT NOT NULL UNIQUE,
    issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_cert_enrollment UNIQUE (user_id, certificate_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_ucerts_user ON user_certificates (user_id);

-- ============================================================================
-- 26. ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_metrics_daily (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date           DATE NOT NULL UNIQUE,
    total_schools         INT NOT NULL DEFAULT 0,
    active_schools        INT NOT NULL DEFAULT 0,
    total_students        INT NOT NULL DEFAULT 0,
    active_students       INT NOT NULL DEFAULT 0,
    total_enrollments     INT NOT NULL DEFAULT 0,
    total_xp_awarded      BIGINT NOT NULL DEFAULT 0,
    revenue_total         NUMERIC(14,2) NOT NULL DEFAULT 0,
    new_subscriptions     INT NOT NULL DEFAULT 0,
    churned_subscriptions INT NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_metrics_daily (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id                UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    metric_date              DATE NOT NULL,
    active_students          INT NOT NULL DEFAULT 0,
    total_lessons_completed  INT NOT NULL DEFAULT 0,
    total_quizzes_taken      INT NOT NULL DEFAULT 0,
    avg_quiz_score           NUMERIC(5,2),
    total_xp_awarded         BIGINT NOT NULL DEFAULT 0,
    avg_session_minutes      NUMERIC(8,2),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_school_metric_date UNIQUE (school_id, metric_date)
);

CREATE TABLE IF NOT EXISTS course_metrics_daily (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    metric_date       DATE NOT NULL,
    total_enrollments INT NOT NULL DEFAULT 0,
    active_learners   INT NOT NULL DEFAULT 0,
    completions       INT NOT NULL DEFAULT 0,
    avg_progress_pct  NUMERIC(5,2),
    avg_quiz_score    NUMERIC(5,2),
    total_xp_awarded  BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_course_metric_date UNIQUE (course_id, metric_date)
);

-- ============================================================================
-- 27. AUDIT & SECURITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    school_id   UUID REFERENCES schools(id) ON DELETE SET NULL,
    action      audit_action NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school  ON audit_logs (school_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS login_attempts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          CITEXT NOT NULL,
    user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address     INET NOT NULL,
    user_agent     TEXT,
    success        BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_email   ON login_attempts (email);
CREATE INDEX IF NOT EXISTS idx_login_created ON login_attempts (created_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_prt_expiry CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_prt_token   ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user    ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens (expires_at);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_evt_expiry CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_evt_user  ON email_verification_tokens (user_id);

-- ============================================================================
-- 28. PLATFORM SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
    id                 TEXT PRIMARY KEY,
    logo_url           TEXT,
    favicon_url        TEXT,
    platform_name      TEXT NOT NULL DEFAULT 'TechNurture',
    logo_layout        TEXT NOT NULL DEFAULT 'horizontal',
    show_platform_name BOOLEAN NOT NULL DEFAULT TRUE,
    logo_height        INTEGER NOT NULL DEFAULT 40,
    hero_video_url     TEXT NOT NULL DEFAULT '',
    hero_video_type    TEXT NOT NULL DEFAULT 'youtube',
    support_email      TEXT,
    currency_default   TEXT NOT NULL DEFAULT 'INR',
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 29. MEDIA ASSETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_url      TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    file_size     BIGINT NOT NULL DEFAULT 0,
    storage_type  storage_type NOT NULL DEFAULT 'local',
    asset_type    asset_type NOT NULL DEFAULT 'document',
    uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    folder        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_asset_type  ON media_assets (asset_type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_assets (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created     ON media_assets (created_at);

-- ============================================================================
-- 30. TRIGGERS — auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
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

-- ============================================================================
-- 31. SEED DATA
-- ============================================================================

-- Platform Settings (global singleton)
INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
ON CONFLICT (id) DO NOTHING;

-- Global Classes 1-12
INSERT INTO classes (name, level) VALUES
    ('Class 1',  1),  ('Class 2',  2),  ('Class 3',  3),  ('Class 4',  4),
    ('Class 5',  5),  ('Class 6',  6),  ('Class 7',  7),  ('Class 8',  8),
    ('Class 9',  9),  ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT (name) DO NOTHING;

-- Default Payment Plans
INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active)
VALUES
    ('Basic Education',  'Foundation for primary classes.',       'annual', 999,  50,  '{"lms": true, "analytics": false}'::jsonb, true),
    ('Pro Academy',      'Advanced tools for the whole school.',  'annual', 4999, 500, '{"lms": true, "analytics": true, "priority_support": true}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Achievements
INSERT INTO achievements (name, description, tier, xp_threshold, criteria) VALUES
    ('First Steps',       'Completed your first lesson.',             'bronze',   0,    '{"type": "lesson_completion", "count": 1}'::jsonb),
    ('XP Earner',         'Earned 100 XP.',                          'bronze',   100,  '{"type": "xp_threshold", "xp": 100}'::jsonb),
    ('On a Roll',         'Maintained a 3-day streak.',              'bronze',   0,    '{"type": "streak", "days": 3}'::jsonb),
    ('Knowledge Seeker',  'Completed 10 lessons.',                   'silver',   0,    '{"type": "lesson_completion", "count": 10}'::jsonb),
    ('Quiz Champion',     'Passed 5 quizzes with 80%+ score.',       'silver',   0,    '{"type": "quiz_pass", "count": 5, "min_score": 80}'::jsonb),
    ('Consistency King',  'Maintained a 7-day streak.',              'gold',     0,    '{"type": "streak", "days": 7}'::jsonb),
    ('XP Master',         'Earned 1000 XP.',                         'gold',     1000, '{"type": "xp_threshold", "xp": 1000}'::jsonb),
    ('Course Conqueror',  'Completed an entire course.',             'gold',     0,    '{"type": "course_completion", "count": 1}'::jsonb),
    ('Legend',            'Earned 10,000 XP.',                       'platinum', 10000,'{"type": "xp_threshold", "xp": 10000}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 32. SUPER ADMIN
-- Password is 'AdminPassword123!' hashed with bcrypt (10 rounds)
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN via the admin portal.
-- ============================================================================
INSERT INTO users (
    id, school_id, role, first_name, last_name, email, password_hash, is_active
) VALUES (
    gen_random_uuid(),
    NULL,
    'super_admin',
    'Super',
    'Admin',
    'admin@technurture.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    TRUE
) ON CONFLICT DO NOTHING;

-- (All statements above run in auto-commit mode. No COMMIT needed.)
