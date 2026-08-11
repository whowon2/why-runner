ALTER TABLE "lesson_track" RENAME TO "lesson";--> statement-breakpoint
ALTER TABLE "lesson_track_submission" RENAME TO "lesson_submission";--> statement-breakpoint
ALTER TABLE "lesson_submission" RENAME COLUMN "track_id" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_track_slug_unique";--> statement-breakpoint
ALTER TABLE "exercise" DROP CONSTRAINT "exercise_lesson_id_lesson_track_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_track_classroom_id_classroom_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_submission" DROP CONSTRAINT "lesson_track_submission_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_submission" DROP CONSTRAINT "lesson_track_submission_track_id_lesson_track_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_submission" DROP CONSTRAINT "lesson_track_submission_user_id_track_id_pk";--> statement-breakpoint
ALTER TABLE "lesson_submission" ADD CONSTRAINT "lesson_submission_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id");--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_submission" ADD CONSTRAINT "lesson_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_submission" ADD CONSTRAINT "lesson_submission_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_slug_unique" UNIQUE("slug");