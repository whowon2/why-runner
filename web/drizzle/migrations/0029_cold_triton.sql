CREATE TABLE "classroom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Untitled Class' NOT NULL,
	"join_code" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classroom_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "classroom_membership" (
	"user_id" text NOT NULL,
	"classroom_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classroom_membership_user_id_classroom_id_pk" PRIMARY KEY("user_id","classroom_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_language_requirement" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lesson_themes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lesson_theme_requirement" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_language_skill" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_theme_skill" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lesson_language_requirement" CASCADE;--> statement-breakpoint
DROP TABLE "lesson_themes" CASCADE;--> statement-breakpoint
DROP TABLE "lesson_theme_requirement" CASCADE;--> statement-breakpoint
DROP TABLE "user_language_skill" CASCADE;--> statement-breakpoint
DROP TABLE "user_theme_skill" CASCADE;--> statement-breakpoint
ALTER TABLE "lesson_completion" ALTER COLUMN "language" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_track" ALTER COLUMN "title" SET DEFAULT 'Untitled Assignment';--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_track" ADD COLUMN "classroom_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_track" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
-- Backfill: any pre-existing tracks (from before classes existed) move into
-- one default class, owned by whoever created the oldest track.
INSERT INTO "classroom" ("name", "join_code", "created_by")
SELECT 'Default Class', substr(md5(random()::text), 1, 6), "created_by"
FROM "lesson_track"
ORDER BY "created_at" ASC
LIMIT 1;
--> statement-breakpoint
UPDATE "lesson_track"
SET "classroom_id" = (SELECT "id" FROM "classroom" ORDER BY "created_at" ASC LIMIT 1)
WHERE "classroom_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "lesson_track" ALTER COLUMN "classroom_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "classroom_membership" ADD CONSTRAINT "classroom_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_membership" ADD CONSTRAINT "classroom_membership_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_track" ADD CONSTRAINT "lesson_track_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."lesson_theme";