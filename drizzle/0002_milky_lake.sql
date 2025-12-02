CREATE TABLE "submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" serial NOT NULL,
	"contest_id" serial NOT NULL
);
