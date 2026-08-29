DELETE FROM "notification" WHERE "type" IN ('FOLLOW', 'ACTIVITY_LIKE', 'ACTIVITY_COMMENT', 'FOLLOWED_USER_PUBLISHED_PROBLEM');--> statement-breakpoint
DELETE FROM "notification_preference" WHERE "type" IN ('FOLLOW', 'ACTIVITY_LIKE', 'ACTIVITY_COMMENT', 'FOLLOWED_USER_PUBLISHED_PROBLEM');--> statement-breakpoint
ALTER TABLE "activity_comment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_feed" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_like" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_follow" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activity_comment" CASCADE;--> statement-breakpoint
DROP TABLE "activity_feed" CASCADE;--> statement-breakpoint
DROP TABLE "activity_like" CASCADE;--> statement-breakpoint
DROP TABLE "user_follow" CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notification_preference" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('CONTEST_JOIN_REQUEST', 'CONTEST_JOIN_APPROVED', 'CONTEST_JOIN_REJECTED', 'SUBMISSION_GRADED', 'LESSON_UNLOCKED');--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "notification_preference" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
DROP INDEX "notification_activity_idx";--> statement-breakpoint
ALTER TABLE "notification" DROP COLUMN "activity_id";