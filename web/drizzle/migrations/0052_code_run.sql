CREATE TYPE "public"."code_run_status" AS ENUM('PENDING', 'RUNNING', 'OK', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'ERROR');--> statement-breakpoint
CREATE TABLE "code_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" uuid NOT NULL,
	"contest_id" uuid,
	"exercise_id" uuid,
	"language" "language" NOT NULL,
	"code" text NOT NULL,
	"stdin" text DEFAULT '' NOT NULL,
	"status" "code_run_status" DEFAULT 'PENDING' NOT NULL,
	"stdout" text,
	"stderr" text,
	"stdout_truncated" boolean DEFAULT false NOT NULL,
	"stderr_truncated" boolean DEFAULT false NOT NULL,
	"exit_code" integer,
	"runtime_ms" integer,
	"memory_kb" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest" ADD COLUMN "allow_runs" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "code_run" ADD CONSTRAINT "code_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_run" ADD CONSTRAINT "code_run_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_run" ADD CONSTRAINT "code_run_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_run" ADD CONSTRAINT "code_run_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_run_user_created_idx" ON "code_run" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "code_run_status_created_idx" ON "code_run" USING btree ("status","created_at");