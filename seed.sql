-- ============================================================================
-- EduQuest LMS — Production Schema + Demo Seed Data
-- Auto-executed on first DB init via docker-compose
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lesson_content_type AS ENUM ('video', 'ppt', 'pdf', 'quiz');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('mcq', 'true_false', 'fill_blank', 'multi_select');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE xp_source AS ENUM ('lesson_completion', 'quiz_score', 'daily_streak', 'challenge_win', 'badge_earned', 'bonus', 'manual_adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'role_change', 'subscription_change', 'payment', 'promotion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'void', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SYSTEM DATA
-- ============================================================================

-- Super Admin
INSERT INTO users (id, role, first_name, last_name, email, password_hash)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'super_admin',
    'Platform',
    'Admin',
    'admin@technurture.com',
    crypt('admin123', gen_salt('bf', 10))
) ON CONFLICT (id) DO NOTHING;

-- Grade
INSERT INTO grades (id, name, level) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Grade 8', 8),
    ('f0000000-0000-0000-0000-000000000002', 'Grade 9', 9),
    ('f0000000-0000-0000-0000-000000000003', 'Grade 10', 10)
ON CONFLICT (id) DO NOTHING;
