CREATE TYPE "public"."survey_form" AS ENUM('contest_author', 'contest_participant', 'lesson_author', 'lesson_student');--> statement-breakpoint
CREATE TABLE "survey_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"form" "survey_form" NOT NULL,
	"form_version" integer NOT NULL,
	"contest_id" uuid,
	"lesson_id" uuid,
	"entity_name" text NOT NULL,
	"answers" jsonb NOT NULL,
	"sus_score" real NOT NULL,
	"consented_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "survey_response_entity_matches_form" CHECK (("survey_response"."form" IN ('contest_author', 'contest_participant') AND "survey_response"."lesson_id" IS NULL)
        OR ("survey_response"."form" IN ('lesson_author', 'lesson_student') AND "survey_response"."contest_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_response" ADD CONSTRAINT "survey_response_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_user_form_contest_unique" ON "survey_response" USING btree ("user_id","form","contest_id") WHERE "survey_response"."contest_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "survey_response_user_form_lesson_unique" ON "survey_response" USING btree ("user_id","form","lesson_id") WHERE "survey_response"."lesson_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "survey_response_form_idx" ON "survey_response" USING btree ("form");