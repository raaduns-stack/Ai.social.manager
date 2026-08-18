-- Custom SQL migration file, put your code below! -- 
CREATE TYPE "public"."variation_approval_status" AS ENUM(
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REVISION_REQUESTED',
  'REJECTED'
);--> statement-breakpoint

ALTER TABLE "content_suggestions"
ADD COLUMN "approval_status" "variation_approval_status"
DEFAULT 'PENDING_APPROVAL' NOT NULL;--> statement-breakpoint

ALTER TABLE "content_suggestions"
ADD COLUMN "revision_notes" text;