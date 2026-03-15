ALTER TABLE "media_assets" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "asset_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "processing_status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;