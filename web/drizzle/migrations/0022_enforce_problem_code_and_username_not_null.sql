ALTER TABLE "problem" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");