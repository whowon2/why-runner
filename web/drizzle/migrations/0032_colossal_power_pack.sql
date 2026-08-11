CREATE TABLE "lesson_constraint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"kind" "problem_constraint_kind" NOT NULL,
	"rule_type" "structural_constraint_rule_type",
	"rule_params" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "problem_constraint" CASCADE;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_constraint" ADD CONSTRAINT "lesson_constraint_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_constraint_one_algo_requirement" ON "lesson_constraint" USING btree ("lesson_id") WHERE "lesson_constraint"."kind" = 'algorithm_requirement';--> statement-breakpoint
ALTER TABLE "problem_validation" DROP COLUMN "constraints_hash";--> statement-breakpoint
ALTER TABLE "problem_validation" DROP COLUMN "constraint_violation_detail";