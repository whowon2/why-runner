ALTER TABLE "contest" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "problem" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "problem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "problem_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "contest_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "problem_on_contest" ALTER COLUMN "problem_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "problem_on_contest" ALTER COLUMN "contest_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_on_contest" ALTER COLUMN "contest_id" SET DATA TYPE uuid;