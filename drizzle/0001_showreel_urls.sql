ALTER TABLE "actors" ADD COLUMN "showreel_urls" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
-- Carry over any single showreel link into the new list.
UPDATE "actors" SET "showreel_urls" = ARRAY["showreel_url"] WHERE "showreel_url" IS NOT NULL AND "showreel_url" <> '';
