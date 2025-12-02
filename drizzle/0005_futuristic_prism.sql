ALTER TABLE "submission" ALTER COLUMN "user_id" SET DEFAULT 'anonymous';--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "code" text NOT NULL;