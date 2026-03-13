DELETE FROM super_admins WHERE email LIKE '%$%';
UPDATE super_admins SET password_hash = '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu' WHERE email = 'admin@technurture.com';
-- If for some reason the above user doesn't exist, insert it
INSERT INTO super_admins (id, first_name, last_name, email, password_hash, is_active)
SELECT gen_random_uuid(), 'Super', 'Admin', 'admin@technurture.com', '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu', TRUE
WHERE NOT EXISTS (SELECT 1 FROM super_admins WHERE email = 'admin@technurture.com');
