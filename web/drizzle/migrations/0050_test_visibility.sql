CREATE TYPE "public"."test_visibility" AS ENUM('problem_default', 'show_all', 'hide_all');--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "test_visibility" "test_visibility" DEFAULT 'problem_default' NOT NULL;--> statement-breakpoint
-- Lessons that showed expected outputs keep showing them; the rest now follow
-- each test's own visibility flag (before, every input was shown).
UPDATE "lesson" SET "test_visibility" = 'show_all' WHERE "show_outputs";--> statement-breakpoint
ALTER TABLE "lesson" DROP COLUMN "show_outputs";--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "visible" boolean[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
-- The first `example_count` tests were the public examples.
UPDATE "problem" SET "visible" = ARRAY(
  SELECT i <= "example_count" FROM generate_series(1, cardinality("inputs")) AS i
);--> statement-breakpoint
ALTER TABLE "problem" DROP COLUMN "example_count";
