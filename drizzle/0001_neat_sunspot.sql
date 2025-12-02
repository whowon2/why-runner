CREATE TABLE "problem" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_on_contest" (
	"problem_id" serial NOT NULL,
	"contest_id" serial NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_on_contest" ADD COLUMN "score" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_on_contest" ADD CONSTRAINT "problem_on_contest_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE cascade ON UPDATE no action;