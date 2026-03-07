ALTER TABLE "courses" ADD COLUMN "category" text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "topics" text DEFAULT 'Technology' NOT NULL;