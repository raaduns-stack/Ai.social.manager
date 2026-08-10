CREATE TYPE "public"."upload_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "status" "upload_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "rejection_reason" varchar(500);