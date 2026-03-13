ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_position_secs INTEGER NOT NULL DEFAULT 0;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_email TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS currency_default TEXT NOT NULL DEFAULT 'INR';
