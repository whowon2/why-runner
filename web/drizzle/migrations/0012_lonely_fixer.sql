CREATE TABLE "lesson_themes" (
	"lesson_id" uuid NOT NULL,
	"theme" "lesson_theme" NOT NULL,
	CONSTRAINT "lesson_themes_lesson_id_theme_pk" PRIMARY KEY("lesson_id","theme")
);
--> statement-breakpoint
ALTER TABLE "lesson_themes" ADD CONSTRAINT "lesson_themes_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "lesson_themes" ("lesson_id", "theme") SELECT "id", "theme" FROM "lesson";--> statement-breakpoint
DO $$
BEGIN
  IF (SELECT count(*) FROM "lesson_themes") < (SELECT count(*) FROM "lesson") THEN
    RAISE EXCEPTION 'lesson_themes backfill row count is less than lesson row count, aborting drop';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "lesson" DROP COLUMN "theme";