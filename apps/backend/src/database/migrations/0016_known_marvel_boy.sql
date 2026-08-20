CREATE TYPE "public"."permission_level" AS ENUM('full', 'manage', 'view', 'own_only', 'none');--> statement-breakpoint
CREATE TYPE "public"."scheduled_post_status" AS ENUM('SCHEDULED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."publishing_log_status" AS ENUM('PUBLISHED', 'FAILED');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'support_staff' BEFORE 'designer';--> statement-breakpoint
ALTER TYPE "public"."kyc_status" ADD VALUE 'resubmission_required';--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" NOT NULL,
	"module" varchar(255) NOT NULL,
	"access_level" "permission_level" NOT NULL,
	CONSTRAINT "role_module_unique" UNIQUE("role","module")
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"scheduled_post_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_post_id" uuid NOT NULL,
	"variation_id" uuid NOT NULL,
	"social_account_id" uuid NOT NULL,
	"platform" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"media_url" varchar(2048),
	"scheduled_at" timestamp NOT NULL,
	"status" "scheduled_post_status" DEFAULT 'SCHEDULED' NOT NULL,
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_posts_variation_id_unique" UNIQUE("variation_id")
);
--> statement-breakpoint
CREATE TABLE "publishing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheduled_post_id" uuid NOT NULL,
	"status" "publishing_log_status" NOT NULL,
	"external_post_id" varchar(255),
	"error" text,
	"attempted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "description" varchar(500);--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "monthly_post_limit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "is_update_request" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "publishing_logs" ADD CONSTRAINT "publishing_logs_scheduled_post_id_scheduled_posts_scheduled_post_id_fk" FOREIGN KEY ("scheduled_post_id") REFERENCES "public"."scheduled_posts"("scheduled_post_id") ON DELETE cascade ON UPDATE no action;