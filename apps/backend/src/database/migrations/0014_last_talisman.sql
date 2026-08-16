CREATE TYPE "public"."calendar_job_status" AS ENUM('PENDING', 'GENERATING', 'GENERATED', 'FAILED');--> statement-breakpoint
CREATE TABLE "calendar_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" varchar(7) NOT NULL,
	"platforms" json DEFAULT '[]'::json NOT NULL,
	"status" "calendar_job_status" DEFAULT 'PENDING' NOT NULL,
	"error_info" text,
	"result_ids" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_generation_jobs" ADD CONSTRAINT "calendar_generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;