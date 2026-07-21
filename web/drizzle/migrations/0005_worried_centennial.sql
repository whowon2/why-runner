ALTER TABLE "contest" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_on_contest" ADD COLUMN "join_status" text DEFAULT 'accepted' NOT NULL;