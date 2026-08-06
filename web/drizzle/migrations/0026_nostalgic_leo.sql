CREATE TABLE "problem_reference_solution" (
	"problem_id" uuid PRIMARY KEY NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"language" "language",
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_validation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"code" text NOT NULL,
	"language" "language" NOT NULL,
	"status" "submission_status" DEFAULT 'PENDING' NOT NULL,
	"output" text,
	"io_hash" text NOT NULL,
	"runtime_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_reference_solution" ADD CONSTRAINT "problem_reference_solution_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_validation" ADD CONSTRAINT "problem_validation_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;