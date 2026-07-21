ALTER TABLE "contest" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "contest" ADD CONSTRAINT "contest_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_slug_unique" UNIQUE("slug");