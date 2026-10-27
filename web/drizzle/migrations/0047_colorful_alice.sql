-- Added without a default first so existing rows stay NULL (their real join
-- time is unknown) instead of all getting the migration's timestamp.
ALTER TABLE "user_on_contest" ADD COLUMN "joined_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_on_contest" ALTER COLUMN "joined_at" SET DEFAULT now();
