CREATE TYPE "public"."exercise_mode" AS ENUM('code', 'blocks', 'parsons');--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "mode" "exercise_mode" DEFAULT 'code' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "parsons_solution" text;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "editor_mode" "exercise_mode";--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "visual_source" jsonb;--> statement-breakpoint
ALTER TABLE "problem_validation" ADD COLUMN "exercise_id" uuid;