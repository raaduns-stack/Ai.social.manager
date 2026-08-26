CREATE TYPE "public"."account_status" AS ENUM('REGISTRATION_IN_PROGRESS', 'EMAIL_VERIFICATION_PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."variation_approval_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."social_platform" ADD VALUE 'tumblr';--> statement-breakpoint
ALTER TYPE "public"."social_platform" ADD VALUE 'discord';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" "account_status" DEFAULT 'EMAIL_VERIFICATION_PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_manager_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registered_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "provider_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "token_secret" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD COLUMN "approval_status" "variation_approval_status" DEFAULT 'PENDING_APPROVAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD COLUMN "revision_notes" text;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_file_size" integer;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "cert_of_registration_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_file_size" integer;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "utility_bill_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_file_size" integer;--> statement-breakpoint
ALTER TABLE "kyc" ADD COLUMN "owner_id_uploaded_at" timestamp;