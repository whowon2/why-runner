-- Backfill legacy rows created before the slug column existed. Falls back
-- to the row's own id (unique, satisfies the slug_unique constraint from
-- 0035) so the NOT NULL below doesn't fail on pre-existing null slugs.
-- No-op (0 rows) on any DB where every row already has a slug.
UPDATE "classroom" SET "slug" = "id"::text WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "lesson" SET "slug" = "id"::text WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "lesson_track" SET "slug" = "id"::text WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "classroom" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_track" ALTER COLUMN "slug" SET NOT NULL;