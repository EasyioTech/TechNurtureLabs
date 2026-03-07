ALTER TABLE "platform_settings" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "platform_name" text DEFAULT 'TechNurture' NOT NULL;