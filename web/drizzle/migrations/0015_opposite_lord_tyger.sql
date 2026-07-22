ALTER TABLE "problem" ADD COLUMN "time_limit_ms" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "memory_limit_mb" integer DEFAULT 512 NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "runtime_ms" integer;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "memory_kb" integer;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "code_size" integer;--> statement-breakpoint
UPDATE "submission" SET "code_size" = length("code") WHERE "code_size" IS NULL;