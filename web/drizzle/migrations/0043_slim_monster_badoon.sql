CREATE TYPE "public"."contest_ai_assistance" AS ENUM('off', 'concept', 'hint', 'pinpoint');--> statement-breakpoint
-- Backfill existing contests to 'hint' (closest to the previous always-on help), then default new ones to 'off'.
ALTER TABLE "contest" ADD COLUMN "ai_assistance" "contest_ai_assistance" DEFAULT 'hint' NOT NULL;--> statement-breakpoint
ALTER TABLE "contest" ALTER COLUMN "ai_assistance" SET DEFAULT 'off';
