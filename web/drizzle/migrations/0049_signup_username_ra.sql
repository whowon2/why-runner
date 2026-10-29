ALTER TABLE "user" DROP COLUMN "finished_onboarding";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_lower_idx" ON "user" USING btree (lower("username"));--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ra" text;--> statement-breakpoint
-- Classroom test 2026-10-29: students typed their RA (7-digit IFMG student
-- ID) as username. Copy it into the new column; the username is kept.
UPDATE "user" SET "ra" = "username" WHERE "username" ~ '^\d{7}$' AND "ra" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_ra_unique" UNIQUE("ra");
