CREATE TYPE "public"."classroom_role" AS ENUM('student', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "classroom_membership" ADD COLUMN "role" "classroom_role" DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
-- An owner's own membership row (self-joined via the code) is staff, never a student.
UPDATE "classroom_membership" AS m SET "role" = 'teacher' FROM "classroom" AS c WHERE c."id" = m."classroom_id" AND m."user_id" = c."created_by";
