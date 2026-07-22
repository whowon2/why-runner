CREATE SEQUENCE "public"."problem_code_seq" INCREMENT BY 1 MINVALUE 0 MAXVALUE 9223372036854775807 START WITH 0 CACHE 1;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "finished_onboarding" boolean DEFAULT false NOT NULL;