-- Pass 1 of a two-step rename (lesson_track -> lesson, lesson -> exercise):
-- same-named tables can't be diffed as a rename by drizzle-kit, so this
-- migration renames old `lesson` -> `exercise` first, while `lesson_track`
-- keeps its name for now. Pass 2 (next migration) renames
-- `lesson_track` -> `lesson` once "lesson" is free.

-- 1. Table renames
ALTER TABLE "lesson_constraint" RENAME TO "exercise_constraint";--> statement-breakpoint
ALTER TABLE "lesson" RENAME TO "exercise";--> statement-breakpoint
ALTER TABLE "lesson_completion" RENAME TO "exercise_completion";--> statement-breakpoint

-- 2. Column renames (all data-preserving, no ADD/DROP)
ALTER TABLE "exercise_constraint" RENAME COLUMN "lesson_id" TO "exercise_id";--> statement-breakpoint
ALTER TABLE "exercise" RENAME COLUMN "track_id" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "exercise_completion" RENAME COLUMN "lesson_id" TO "exercise_id";--> statement-breakpoint
ALTER TABLE "notification" RENAME COLUMN "lesson_id" TO "exercise_id";--> statement-breakpoint
ALTER TABLE "submission" RENAME COLUMN "lesson_id" TO "exercise_id";--> statement-breakpoint

-- 3. Drop old constraints/indexes referencing pre-rename names
ALTER TABLE "exercise" DROP CONSTRAINT "lesson_slug_unique";--> statement-breakpoint
ALTER TABLE "exercise_constraint" DROP CONSTRAINT "lesson_constraint_lesson_id_lesson_id_fk";--> statement-breakpoint
ALTER TABLE "exercise" DROP CONSTRAINT "lesson_track_id_lesson_track_id_fk";--> statement-breakpoint
ALTER TABLE "exercise" DROP CONSTRAINT "lesson_problem_id_problem_id_fk";--> statement-breakpoint
ALTER TABLE "exercise_completion" DROP CONSTRAINT "lesson_completion_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "exercise_completion" DROP CONSTRAINT "lesson_completion_lesson_id_lesson_id_fk";--> statement-breakpoint
ALTER TABLE "exercise_completion" DROP CONSTRAINT "lesson_completion_submission_id_submission_id_fk";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notification_lesson_id_lesson_id_fk";--> statement-breakpoint
DROP INDEX "lesson_constraint_one_algo_requirement";--> statement-breakpoint
DROP INDEX "lesson_constraint_one_per_rule_type";--> statement-breakpoint
DROP INDEX "notification_lesson_idx";--> statement-breakpoint
ALTER TABLE "exercise_completion" DROP CONSTRAINT "lesson_completion_user_id_lesson_id_pk";--> statement-breakpoint

-- 4. Add constraints/indexes under the new names
ALTER TABLE "exercise_completion" ADD CONSTRAINT "exercise_completion_user_id_exercise_id_pk" PRIMARY KEY("user_id","exercise_id");--> statement-breakpoint
ALTER TABLE "exercise_constraint" ADD CONSTRAINT "exercise_constraint_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_lesson_id_lesson_track_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson_track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_completion" ADD CONSTRAINT "exercise_completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_completion" ADD CONSTRAINT "exercise_completion_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_completion" ADD CONSTRAINT "exercise_completion_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_constraint_one_algo_requirement" ON "exercise_constraint" USING btree ("exercise_id") WHERE "exercise_constraint"."kind" = 'algorithm_requirement';--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_constraint_one_per_rule_type" ON "exercise_constraint" USING btree ("exercise_id","rule_type");--> statement-breakpoint
CREATE INDEX "notification_exercise_idx" ON "notification" USING btree ("exercise_id");--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_slug_unique" UNIQUE("slug");
