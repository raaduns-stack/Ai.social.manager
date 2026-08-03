CREATE TYPE "public"."social_platform" AS ENUM('facebook', 'instagram', 'tiktok', 'x', 'youtube', 'linkedin');--> statement-breakpoint
CREATE TYPE "public"."social_status" AS ENUM('connected', 'disconnected', 'action_required');--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "social_platform" NOT NULL,
	"account_handle" varchar(255) NOT NULL,
	"status" "social_status" NOT NULL,
	"connected_at" timestamp,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;