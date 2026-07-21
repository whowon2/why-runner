CREATE TYPE "public"."lesson_theme" AS ENUM('strings', 'arrays', 'loops', 'conditionals');--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"theme" "lesson_theme" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"primary_language" "language",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_problem_id_unique" UNIQUE("problem_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_completion" (
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"language" "language" NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_completion_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "user_language_skill" (
	"user_id" text NOT NULL,
	"language" "language" NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_language_skill_user_id_language_pk" PRIMARY KEY("user_id","language")
);
--> statement-breakpoint
CREATE TABLE "user_theme_skill" (
	"user_id" text NOT NULL,
	"theme" "lesson_theme" NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_theme_skill_user_id_theme_pk" PRIMARY KEY("user_id","theme")
);
--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "question_letter" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "contest_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_language_skill" ADD CONSTRAINT "user_language_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_theme_skill" ADD CONSTRAINT "user_theme_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;