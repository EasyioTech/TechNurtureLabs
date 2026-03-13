-- ============================================================================
-- TechNurture LMS — PRODUCTION SECURE INITIALIZATION
-- This script hardens the database and sets up the primary super admin.
-- ============================================================================

-- 1. CLEANUP INSECURE DEFAULTS
DELETE FROM super_admins WHERE email = 'admin@technurture.com';

-- 2. CREATE PRODUCTION SUPER ADMIN
-- Uses envsubst placeholders for security and customization.
INSERT INTO super_admins (
    id, 
    first_name, 
    last_name, 
    email, 
    password_hash, 
    is_active, 
    created_at
) VALUES (
    gen_random_uuid(),
    '${ADMIN_FIRST_NAME}',           
    '${ADMIN_LAST_NAME}',             
    '${ADMIN_EMAIL}', 
    '${ADMIN_PASSWORD_HASH}', 
    TRUE,
    now()
) ON CONFLICT (email) DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE;

-- 3. LOCKDOWN & CONFIGURE PLATFORM SETTINGS
-- Ensures no 500 errors on first load due to missing critical configurations.
INSERT INTO platform_settings (
    id, 
    platform_name, 
    support_email, 
    logo_url, 
    favicon_url,
    logo_layout,
    show_platform_name,
    logo_height,
    hero_video_url,
    hero_video_type,
    currency_default,
    updated_at
) VALUES (
    'global', 
    '${PLATFORM_NAME}', 
    '${SUPPORT_EMAIL}',
    '${PLATFORM_LOGO_URL}', 
    '${PLATFORM_FAVICON_URL}', 
    '${LOGO_LAYOUT}',
    ${SHOW_PLATFORM_NAME},
    ${LOGO_HEIGHT},
    '${HERO_VIDEO_URL}', 
    '${HERO_VIDEO_TYPE}', 
    '${CURRENCY_DEFAULT}',
    now()
) ON CONFLICT (id) DO UPDATE SET 
    platform_name = EXCLUDED.platform_name,
    support_email = EXCLUDED.support_email,
    logo_url = COALESCE(NULLIF(EXCLUDED.logo_url, ''), platform_settings.logo_url),
    logo_layout = EXCLUDED.logo_layout,
    show_platform_name = EXCLUDED.show_platform_name,
    logo_height = EXCLUDED.logo_height,
    hero_video_url = COALESCE(NULLIF(EXCLUDED.hero_video_url, ''), platform_settings.hero_video_url),
    hero_video_type = EXCLUDED.hero_video_type;

-- 4. ENSURE CRITICAL SEED DATA
INSERT INTO classes (name, level) VALUES
    ('Class 1',  1),  ('Class 2',  2),  ('Class 3',  3),  ('Class 4',  4),
    ('Class 5',  5),  ('Class 6',  6),  ('Class 7',  7),  ('Class 8',  8),
    ('Class 9',  9),  ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT (name) DO NOTHING;

INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active)
VALUES
    ('Basic Education',  'Foundation for primary classes.',       'annual', 999,  50,  '{"lms": true, "analytics": false}'::jsonb, true),
    ('Pro Academy',      'Advanced tools for the whole school.',  'annual', 4999, 500, '{"lms": true, "analytics": true, "priority_support": true}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- 5. AUDIT LOG INITIALIZATION
INSERT INTO audit_logs (
    id, 
    user_type, 
    action, 
    entity_type, 
    metadata, 
    created_at
) VALUES (
    gen_random_uuid(),
    'super_admin',
    'create',
    'system_init',
    '{"event": "Production security hardening and settings initialization applied"}'::jsonb,
    now()
);

-- ============================================================================
-- END OF SECURE INIT
-- ============================================================================
