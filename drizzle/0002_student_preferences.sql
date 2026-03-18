ALTER TABLE "students" ADD COLUMN "notification_preferences" jsonb DEFAULT '{"mobile_push":true,"email_reports":true,"new_content":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "appearance_settings" jsonb DEFAULT '{"dark_mode":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "privacy_settings" jsonb DEFAULT '{"public_profile":true}'::jsonb NOT NULL;
