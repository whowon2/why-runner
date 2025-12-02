ALTER TABLE "problem_on_contest" DROP CONSTRAINT "problem_on_contest_contest_id_contest_id_fk";
--> statement-breakpoint
ALTER TABLE "user_on_contest" DROP CONSTRAINT "user_on_contest_contest_id_contest_id_fk";
--> statement-breakpoint
ALTER TABLE "problem_on_contest" ADD CONSTRAINT "problem_on_contest_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_on_contest" ADD CONSTRAINT "user_on_contest_contest_id_contest_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contest"("id") ON DELETE cascade ON UPDATE cascade;