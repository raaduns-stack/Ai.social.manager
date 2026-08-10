-- Migration 0010: Add content_calendar + settings tables (idempotent)
-- Some of these tables/enums/columns may already exist from Pascal's branch migrations.
-- Using IF NOT EXISTS / DO $$ guards to make this safe to run.

DO $$ BEGIN
  CREATE TYPE "public"."post_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."post_platform" AS ENUM('Instagram', 'LinkedIn', 'X / Twitter', 'TikTok', 'Facebook');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."post_status" AS ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "content_calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"caption" text NOT NULL,
	"platform" "post_platform" NOT NULL,
	"status" "post_status" DEFAULT 'DRAFT' NOT NULL,
	"approval_status" "post_approval_status" DEFAULT 'PENDING' NOT NULL,
	"admin_notes" text,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"media_url" varchar(2048),
	"hashtags" json DEFAULT '[]'::json,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "company_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"logo_url" text,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"website" varchar(255),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"business_description" text,
	"registration_number" varchar(100),
	"tax_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "customer_company_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"business_description" text,
	"industry" varchar(100),
	"website" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"address_line_1" varchar(255),
	"city" varchar(100),
	"country" varchar(100),
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_company_profile_user_id_unique" UNIQUE("user_id")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "email_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_username" varchar(255) NOT NULL,
	"smtp_password_encrypted" text NOT NULL,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"reply_to_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" varchar(60) NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_pref_user_type_idx" UNIQUE("user_id","notification_type")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notification_type_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_type" varchar(60) NOT NULL,
	"email_available" boolean DEFAULT true NOT NULL,
	"in_app_available" boolean DEFAULT true NOT NULL,
	"whatsapp_available" boolean DEFAULT false NOT NULL,
	"is_enabled_globally" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_type_settings_notification_type_unique" UNIQUE("notification_type")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payment_gateway_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway" varchar(30) DEFAULT 'flutterwave' NOT NULL,
	"public_key" text,
	"secret_key_encrypted" text,
	"webhook_secret_encrypted" text,
	"supported_methods" jsonb DEFAULT '["card"]'::jsonb NOT NULL,
	"is_live_mode" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "social_api_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(30) NOT NULL,
	"client_id" varchar(255),
	"client_secret_encrypted" text,
	"redirect_uri" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"additional_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_api_settings_platform_unique" UNIQUE("platform")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_timezone" varchar(100) DEFAULT 'Africa/Lagos' NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"allow_new_registrations" boolean DEFAULT true NOT NULL,
	"content_approval_required" boolean DEFAULT true NOT NULL,
	"date_format" varchar(30) DEFAULT 'DD/MM/YYYY' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add columns only if they don't exist yet
DO $$ BEGIN
  ALTER TABLE "plans" ADD COLUMN "max_social_accounts" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD COLUMN "resolved_at" timestamp;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

-- Add FK constraints only if they don't exist yet
DO $$ BEGIN
  ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "customer_company_profile" ADD CONSTRAINT "customer_company_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;