ALTER TABLE "exercise_completion" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "show_outputs" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_submission" DROP COLUMN "score";