ALTER TABLE "classroom" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_track" ALTER COLUMN "slug" SET NOT NULL;