CREATE TYPE "public"."problem_constraint_kind" AS ENUM('structural', 'algorithm_requirement');--> statement-breakpoint
CREATE TYPE "public"."structural_constraint_rule_type" AS ENUM('max_loop_nesting_depth', 'forbidden_construct');--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'CONSTRAINT_VIOLATION';--> statement-breakpoint
ALTER TYPE "public"."submission_status" ADD VALUE 'PENDING_CONSTRAINT_CLASSIFICATION';--> statement-breakpoint
CREATE TABLE "problem_constraint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"kind" "problem_constraint_kind" NOT NULL,
	"rule_type" "structural_constraint_rule_type",
	"rule_params" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "constraint_violation_detail" text;--> statement-breakpoint
ALTER TABLE "problem_validation" ADD COLUMN "constraints_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_validation" ADD COLUMN "constraint_violation_detail" text;--> statement-breakpoint
ALTER TABLE "problem_constraint" ADD CONSTRAINT "problem_constraint_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_constraint_one_algo_requirement" ON "problem_constraint" USING btree ("problem_id") WHERE "problem_constraint"."kind" = 'algorithm_requirement';