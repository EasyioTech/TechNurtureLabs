-- ============================================
-- Orchids LMS — Full Schema + Demo Seed Data
-- Run this manually in pgAdmin after the DB is up
-- ============================================
-- Enable pgcrypto for UUID generation and password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================
-- TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    -- 'student', 'school_admin', 'super_admin'
    school_id UUID,
    class_id UUID,
    grade INTEGER,
    bio TEXT,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_lessons_completed INTEGER NOT NULL DEFAULT 0,
    total_learning_time_minutes INTEGER NOT NULL DEFAULT 0,
    avatar_style TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    udise_code TEXT,
    address TEXT,
    district TEXT,
    state TEXT,
    pincode TEXT,
    school_type TEXT,
    grades_available INTEGER [],
    student_count INTEGER DEFAULT 0,
    contact_email TEXT,
    contact_phone TEXT,
    principal_name TEXT,
    branding_config JSONB,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    level_index INTEGER NOT NULL,
    school_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    billing_cycle TEXT NOT NULL,
    features TEXT [],
    max_students INTEGER,
    max_courses INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    grade INTEGER,
    all_grades BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    sequence_index INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    -- 'video', 'mcq', 'ppt'
    content_url TEXT,
    duration INTEGER NOT NULL DEFAULT 10,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS progress_tracking (
    user_id UUID NOT NULL REFERENCES profiles(id),
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    last_position NUMERIC,
    status TEXT NOT NULL DEFAULT 'locked',
    -- 'locked', 'available', 'completed'
    score INTEGER,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    challenge_type TEXT NOT NULL,
    -- 'lessons_completed', 'learning_time'
    target_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    icon TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_daily_challenges (
    user_id UUID NOT NULL REFERENCES profiles(id),
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id),
    challenge_date TEXT NOT NULL,
    -- e.g. '2023-11-20'
    current_progress INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, challenge_id, challenge_date)
);
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID NOT NULL REFERENCES profiles(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);
-- ============================================
-- DEMO SEED DATA
-- Passwords are hashed using pgcrypto bcrypt
-- student@demo.com  / student123
-- school@demo.com   / school123
-- ============================================
INSERT INTO profiles (id, email, password_hash, full_name, role)
VALUES (
        gen_random_uuid(),
        'student@demo.com',
        crypt('student123', gen_salt('bf', 10)),
        'Demo Student',
        'student'
    ) ON CONFLICT (email) DO
UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;
INSERT INTO profiles (id, email, password_hash, full_name, role)
VALUES (
        gen_random_uuid(),
        'school@demo.com',
        crypt('school123', gen_salt('bf', 10)),
        'Demo School Admin',
        'school_admin'
    ) ON CONFLICT (email) DO
UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;