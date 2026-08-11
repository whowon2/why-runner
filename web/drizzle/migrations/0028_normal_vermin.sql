CREATE TABLE "lesson_track" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Untitled Track' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_problem_id_unique";--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "track_id" uuid;--> statement-breakpoint
-- Backfill: existing lessons (pre-dating tracks) all move into one default
-- track, published so today's single global roadmap keeps working unchanged.
-- Owner is the creator of the oldest existing lesson's problem, if any exist.
INSERT INTO "lesson_track" ("title", "description", "is_published", "created_by")
SELECT
	'Roadmap',
	'',
	true,
	"problem"."created_by"
FROM "lesson"
JOIN "problem" ON "problem"."id" = "lesson"."problem_id"
ORDER BY "lesson"."created_at" ASC
LIMIT 1;
--> statement-breakpoint
UPDATE "lesson"
SET "track_id" = (SELECT "id" FROM "lesson_track" LIMIT 1)
WHERE "track_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "track_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_track_id_lesson_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."lesson_track"("id") ON DELETE cascade ON UPDATE no action;
