CREATE TYPE "public"."notification_type" AS ENUM('FOLLOW', 'ACTIVITY_LIKE', 'ACTIVITY_COMMENT', 'CONTEST_JOIN_REQUEST', 'CONTEST_JOIN_APPROVED', 'CONTEST_JOIN_REJECTED', 'SUBMISSION_GRADED', 'FOLLOWED_USER_PUBLISHED_PROBLEM', 'LESSON_UNLOCKED');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"actor_ids" text[] DEFAULT '{}' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"activity_id" uuid,
	"contest_id" uuid,
	"submission_id" uuid,
	"problem_id" uuid,
	"lesson_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preference_user_id_type_pk" PRIMARY KEY("user_id","type")
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_activity_id_activity_feed_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_problem_id_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_recipient_read_idx" ON "notification" USING btree ("recipient_id","read");--> statement-breakpoint
CREATE INDEX "notification_activity_idx" ON "notification" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "notification_contest_idx" ON "notification" USING btree ("contest_id");--> statement-breakpoint
CREATE INDEX "notification_submission_idx" ON "notification" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "notification_problem_idx" ON "notification" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "notification_lesson_idx" ON "notification" USING btree ("lesson_id");--> statement-breakpoint
-- Fires from the judge worker's writeback (a separate process/connection that
-- the Next.js app never observes directly), so SUBMISSION_GRADED notifications
-- are created at the database level instead of application code. Swallows its
-- own errors so a bug here can never block the judge's UPDATE.
CREATE OR REPLACE FUNCTION notify_submission_graded() RETURNS trigger AS $$
BEGIN
	IF NEW.status IN ('PASSED', 'FAILED', 'ERROR') AND NEW.status IS DISTINCT FROM OLD.status THEN
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM "notification_preference"
				WHERE "user_id" = NEW.user_id AND "type" = 'SUBMISSION_GRADED'
			) THEN
				INSERT INTO "notification" ("recipient_id", "type", "submission_id", "problem_id")
				VALUES (NEW.user_id, 'SUBMISSION_GRADED', NEW.id, NEW.problem_id);
			END IF;
		EXCEPTION WHEN OTHERS THEN
			RAISE WARNING 'notify_submission_graded failed for submission %: %', NEW.id, SQLERRM;
		END;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS submission_graded_notify ON "submission";--> statement-breakpoint
CREATE TRIGGER submission_graded_notify
	AFTER UPDATE OF status ON "submission"
	FOR EACH ROW
	EXECUTE FUNCTION notify_submission_graded();