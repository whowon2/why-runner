CREATE TYPE "public"."color_mode" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."editor_line_numbers" AS ENUM('on', 'off', 'relative');--> statement-breakpoint
CREATE TABLE "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"color_mode" "color_mode",
	"theme" jsonb,
	"editor_font_size" integer,
	"editor_auto_close" boolean,
	"editor_vim" boolean,
	"editor_tab_size" integer,
	"editor_word_wrap" boolean,
	"editor_line_numbers" "editor_line_numbers",
	"editor_minimap" boolean,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;