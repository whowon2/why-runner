CREATE TYPE "public"."problem_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "problem" ALTER COLUMN "title" SET DEFAULT 'Untitled Problem';--> statement-breakpoint
ALTER TABLE "problem" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "status" "problem_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ALTER COLUMN "status" SET DEFAULT 'draft';