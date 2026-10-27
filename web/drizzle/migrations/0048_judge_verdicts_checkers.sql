CREATE TYPE "public"."problem_compare_mode" AS ENUM('exact', 'tokens', 'float', 'checker');--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'WRONG_ANSWER';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'TIME_LIMIT_EXCEEDED';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'MEMORY_LIMIT_EXCEEDED';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'COMPILATION_ERROR';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'RUNTIME_ERROR';--> statement-breakpoint
CREATE TABLE "problem_checker" (
	"problem_id" uuid PRIMARY KEY NOT NULL,
	"language" "language" NOT NULL,
	"code" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "compare_mode" "problem_compare_mode" DEFAULT 'tokens' NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "float_epsilon" double precision DEFAULT 0.000001 NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_checker" ADD CONSTRAINT "problem_checker_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Problems that existed before compare modes keep today's trimmed exact match;
-- only new problems get the lenient `tokens` default.
UPDATE "problem" SET "compare_mode" = 'exact';
