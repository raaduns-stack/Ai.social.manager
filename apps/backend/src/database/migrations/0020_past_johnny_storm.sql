ALTER TYPE "public"."calendar_job_status" ADD VALUE 'TIMED_OUT';--> statement-breakpoint
CREATE TABLE "designer_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_generation_jobs" ALTER COLUMN "platforms" SET DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "calendar_generation_jobs" ALTER COLUMN "result_ids" SET DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "designer_invitations" ADD CONSTRAINT "designer_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;