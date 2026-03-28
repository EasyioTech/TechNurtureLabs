-- =============================================================================
-- TECHNURTURE LABS — ADMIN CREDENTIAL RESET
-- =============================================================================
-- Run this on the VPS when the super admin account doesn't exist or
-- the password needs to be reset to the default.
--
-- Usage on VPS:
--   psql $DATABASE_URL -f database/reset-admin.sql
--
-- Or inside the running postgres container:
--   docker exec -i LMS_postgres psql -U postgres -d technurturelabs -f /reset-admin.sql
--
-- After running: log in with the credentials below, then change the password
-- immediately from the super admin dashboard.
-- =============================================================================

-- Email:    admin@technurture.com
-- Password: AdminPassword123!

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

-- If the row already existed (skipped above), force-reset the password and re-activate:
UPDATE super_admins
SET
    password_hash = '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu',
    is_active     = true,
    deleted_at    = NULL
WHERE email = 'admin@technurture.com';

-- Confirm result:
SELECT id, email, is_active, deleted_at FROM super_admins WHERE email = 'admin@technurture.com';
