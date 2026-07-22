CREATE TABLE "lesson_language_requirement" (
	"lesson_id" uuid NOT NULL,
	"language" "language" NOT NULL,
	"min_value" integer NOT NULL,
	CONSTRAINT "lesson_language_requirement_lesson_id_language_pk" PRIMARY KEY("lesson_id","language")
);
--> statement-breakpoint
CREATE TABLE "lesson_theme_requirement" (
	"lesson_id" uuid NOT NULL,
	"theme" "lesson_theme" NOT NULL,
	"min_value" integer NOT NULL,
	CONSTRAINT "lesson_theme_requirement_lesson_id_theme_pk" PRIMARY KEY("lesson_id","theme")
);
--> statement-breakpoint
ALTER TABLE "lesson_language_requirement" ADD CONSTRAINT "lesson_language_requirement_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_theme_requirement" ADD CONSTRAINT "lesson_theme_requirement_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;