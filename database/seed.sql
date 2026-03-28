-- =============================================================================
-- TECHNURTURE LABS — SEED DATA
-- Auto-executed by PostgreSQL on first database initialization via
-- docker-entrypoint-initdb.d/02_seed.sql (runs only on empty data volume).
--
-- Uses ON CONFLICT DO NOTHING (no column target) so it works regardless of
-- whether unique constraints are table constraints or unique indexes.
-- =============================================================================

-- 1. Classes (1–12)
INSERT INTO classes (name, level) VALUES ('Class 1',  1)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 2',  2)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 3',  3)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 4',  4)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 5',  5)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 6',  6)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 7',  7)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 8',  8)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 9',  9)  ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 10', 10) ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 11', 11) ON CONFLICT DO NOTHING;
INSERT INTO classes (name, level) VALUES ('Class 12', 12) ON CONFLICT DO NOTHING;

-- 2. Payment Plans
INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
VALUES ('Basic Education', 'Foundation plan for primary classes.', 'annual', 999, 50, '{"lms":true,"analytics":false}', true, false)
ON CONFLICT DO NOTHING;

INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
VALUES ('Pro Academy', 'Advanced tools for the whole school.', 'annual', 4999, 500, '{"lms":true,"analytics":true,"priority_support":true}', true, true)
ON CONFLICT DO NOTHING;

-- 3. Platform Settings
INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
ON CONFLICT DO NOTHING;

-- 4. Default Super Admin
-- Email:    admin@technurture.com
-- Password: AdminPassword123!
-- IMPORTANT: Change this password immediately after first login.
-- To reset credentials on an existing DB, run: database/reset-admin.sql
INSERT INTO super_admins (id, first_name, last_name, email, password_hash, is_active)
VALUES (
    gen_random_uuid(),
    'Super',
    'Admin',
    'admin@technurture.com',
    '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu',
    true
)
ON CONFLICT DO NOTHING;
