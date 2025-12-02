ALTER TABLE "problem" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "inputs" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "outputs" text[] NOT NULL;