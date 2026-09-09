CREATE TYPE "public"."approval_source" AS ENUM('MANUAL', 'SYSTEM');--> statement-breakpoint
ALTER TYPE "public"."post_platform" ADD VALUE 'Tumblr';--> statement-breakpoint
ALTER TYPE "public"."post_platform" ADD VALUE 'Discord';--> statement-breakpoint
ALTER TYPE "public"."calendar_job_status" ADD VALUE 'TIMED_OUT';--> statement-breakpoint
ALTER TABLE "content_calendar" ADD COLUMN "approval_source" "approval_source" DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_generation_jobs" ADD COLUMN "expected_post_count" integer;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "auto_approve_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "auto_approve_window_hours" integer DEFAULT 24 NOT NULL;