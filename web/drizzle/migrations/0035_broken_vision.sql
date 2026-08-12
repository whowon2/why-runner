ALTER TABLE "classroom" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "lesson_track" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "lesson_track" ADD CONSTRAINT "lesson_track_slug_unique" UNIQUE("slug");