CREATE TABLE "activity_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_like" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_like_user_activity_unique" UNIQUE("user_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "user_follow" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_follow_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id"),
	CONSTRAINT "user_follow_no_self_follow" CHECK ("user_follow"."follower_id" != "user_follow"."following_id")
);
--> statement-breakpoint
ALTER TABLE "activity_comment" ADD CONSTRAINT "activity_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comment" ADD CONSTRAINT "activity_comment_activity_id_activity_feed_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_activity_id_activity_feed_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follow" ADD CONSTRAINT "user_follow_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follow" ADD CONSTRAINT "user_follow_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_follow_following_idx" ON "user_follow" USING btree ("following_id");