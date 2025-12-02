ALTER TABLE "submission" DROP CONSTRAINT "submission_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;