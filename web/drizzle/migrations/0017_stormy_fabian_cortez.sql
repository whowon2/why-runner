CREATE TYPE "public"."contest_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "name" SET DEFAULT 'Untitled Contest';--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contest" ADD COLUMN "status" "contest_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
UPDATE "contest" SET "status" = 'published';