-- ==========================================
-- TechNurture Labs: Fresh Seed Script
-- ==========================================

-- 1. Classes (Academic levels 1 to 12)
INSERT INTO classes (name, level) VALUES 
('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4), 
('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8), 
('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT (name) DO NOTHING;

-- 2. Payment Plans
INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
VALUES 
('Basic Education', 'Foundation for primary classes.', 'annual', 999, 50, '{}', true, false),
('Pro Academy', 'Advanced tools for the whole school.', 'annual', 4999, 500, '{"lms": true, "analytics": true, "priority_support": true}', true, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Platform Settings
INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
ON CONFLICT (id) DO NOTHING;

-- 4. Default Super Admin
-- Email: admin@technurture.com
-- Password: AdminPassword123!
INSERT INTO super_admins (id, first_name, last_name, email, password_hash, is_active)
VALUES (
    gen_random_uuid(),
    'Super',
    'Admin',
    'admin@technurture.com',
    '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu',
    TRUE
) ON CONFLICT (email) DO NOTHING;
