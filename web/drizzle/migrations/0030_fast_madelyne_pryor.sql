CREATE TABLE "lesson_track_submission" (
	"user_id" text NOT NULL,
	"track_id" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_track_submission_user_id_track_id_pk" PRIMARY KEY("user_id","track_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_track_submission" ADD CONSTRAINT "lesson_track_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_track_submission" ADD CONSTRAINT "lesson_track_submission_track_id_lesson_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."lesson_track"("id") ON DELETE cascade ON UPDATE no action;