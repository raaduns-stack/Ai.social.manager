ALTER TYPE "public"."post_platform" ADD VALUE IF NOT EXISTS 'Tumblr';
ALTER TYPE "public"."post_platform" ADD VALUE IF NOT EXISTS 'Discord';

CREATE TYPE "public"."approval_source" AS ENUM('MANUAL', 'SYSTEM');

ALTER TABLE "content_calendar" ADD COLUMN "approval_source" "approval_source" DEFAULT 'MANUAL' NOT NULL;
ALTER TABLE "system_settings" ADD COLUMN "auto_approve_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "system_settings" ADD COLUMN "auto_approve_window_hours" integer DEFAULT 24 NOT NULL;
