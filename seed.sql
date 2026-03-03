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
-- DEMO SEED DATA
-- Tables are created by Drizzle push; this file only seeds data.
-- Passwords: student@demo.com / student123, school@demo.com / school123,
--            superadmin@eduquest.io / admin123
-- ============================================================================

-- School
INSERT INTO schools (id, name, slug, email, phone, city, state, country, pincode, is_active, data_processing_consent, minor_data_guardian_consent)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Delhi Public School, Noida',
    'dps-noida',
    'admin@dpsnoida.edu.in',
    '+919876543210',
    'Noida',
    'Uttar Pradesh',
    'IN',
    '201301',
    TRUE,
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Academic Session
INSERT INTO academic_sessions (id, school_id, name, start_date, end_date, is_current)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '2025-26',
    '2025-04-01',
    '2026-03-31',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Payment Plan
INSERT INTO payment_plans (id, name, description, billing_cycle, price, max_students, trial_days)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Starter Plan',
    'Ideal for small schools up to 200 students',
    'annual',
    49999.00,
    200,
    14
) ON CONFLICT (id) DO NOTHING;

-- Subscription
INSERT INTO school_subscriptions (id, school_id, plan_id, status, current_period_start, current_period_end, trial_start, trial_end)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'active',
    '2025-04-01 00:00:00+05:30',
    '2026-03-31 23:59:59+05:30',
    '2025-04-01 00:00:00+05:30',
    '2025-04-14 23:59:59+05:30'
) ON CONFLICT (id) DO NOTHING;

-- Super Admin
INSERT INTO users (id, role, first_name, last_name, email, password_hash)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'super_admin',
    'Platform',
    'Admin',
    'superadmin@eduquest.io',
    crypt('admin123', gen_salt('bf', 10))
) ON CONFLICT (id) DO NOTHING;

-- School Admin
INSERT INTO users (id, school_id, role, first_name, last_name, email, password_hash, email_verified_at)
VALUES (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'school_admin',
    'Dr. Sarah',
    'Miller',
    'school@demo.com',
    crypt('school123', gen_salt('bf', 10)),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Grade
INSERT INTO grades (id, name, level) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Grade 8', 8)
ON CONFLICT (id) DO NOTHING;

-- School-Grade mapping
INSERT INTO school_grade_mapping (id, school_id, grade_id)
VALUES ('f1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Student
INSERT INTO users (id, school_id, role, first_name, last_name, email, password_hash, date_of_birth, is_minor, guardian_name, guardian_email, guardian_consent, cumulative_xp, current_streak, email_verified_at)
VALUES (
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'student',
    'Alex',
    'Johnson',
    'student@demo.com',
    crypt('student123', gen_salt('bf', 10)),
    '2013-06-15',
    TRUE,
    'Priya Gupta',
    'priya.gupta@gmail.com',
    TRUE,
    1250,
    7,
    now()
) ON CONFLICT (id) DO NOTHING;

-- Student Academic Record
INSERT INTO student_academic_records (id, user_id, school_id, session_id, grade_id, roll_number, section)
VALUES (
    'f2000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    '2025-0042',
    'A'
) ON CONFLICT (id) DO NOTHING;

-- Course
INSERT INTO courses (id, title, slug, description, is_published, total_lessons, total_xp, created_by)
VALUES (
    'aa000000-0000-0000-0000-000000000001',
    'Introduction to Robotics',
    'intro-robotics',
    'Learn the basics of building and programming robots.',
    TRUE,
    20,
    500,
    'e0000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Course-Grade mapping
INSERT INTO course_grade_mapping (id, course_id, grade_id)
VALUES ('aa100000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Lessons
INSERT INTO lessons (id, course_id, title, content_type, sequence_order, duration_minutes, xp_reward, is_published)
VALUES
    ('ab000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'What is a Robot?', 'video', 1, 15, 100, TRUE),
    ('ab000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'Basic Sensors', 'video', 2, 20, 150, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enrollment
INSERT INTO enrollments (id, user_id, course_id, school_id, session_id)
VALUES (
    'ac000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000003',
    'aa000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Achievements
INSERT INTO achievements (id, name, description, tier, xp_threshold)
VALUES
    ('ad000000-0000-0000-0000-000000000001', 'First Steps', 'Complete your first lesson', 'bronze', 25),
    ('ad000000-0000-0000-0000-000000000002', 'Deep Learner', 'Complete 10 lessons', 'silver', 500)
ON CONFLICT (id) DO NOTHING;

-- Daily Challenges
INSERT INTO daily_challenges (id, title, description, xp_reward, criteria, challenge_date, status)
VALUES
    ('ae000000-0000-0000-0000-000000000001', 'Early Bird', 'Complete 1 lesson today', 50, '{"type": "lessons_completed", "target": 1}', CURRENT_DATE, 'active'),
    ('ae000000-0000-0000-0000-000000000002', 'Deep Learner', 'Spend 30 minutes learning', 100, '{"type": "learning_time", "target": 30}', CURRENT_DATE + INTERVAL '1 day', 'active')
ON CONFLICT (id) DO NOTHING;

-- Payment Transaction
INSERT INTO payment_transactions (id, school_id, subscription_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status)
VALUES (
    'af000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'order_DemoRzp001',
    'pay_DemoRzp001',
    'sig_DemoRzp001',
    49999.00,
    'captured'
) ON CONFLICT (id) DO NOTHING;
