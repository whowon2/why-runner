CREATE TYPE "public"."submission_status" AS ENUM('PENDING', 'PASSED', 'FAILED', 'ERROR', 'RUNNING');--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."submission_status";--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "status" SET DATA TYPE "public"."submission_status" USING "status"::"public"."submission_status";--> statement-breakpoint
ALTER TABLE "user_on_contest" DROP COLUMN "score";