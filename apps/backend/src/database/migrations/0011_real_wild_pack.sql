CREATE TYPE "public"."login_failure_reason" AS ENUM('invalid_credentials', 'account_inactive', 'email_not_verified', 'too_many_attempts', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."login_status" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"status" "login_status" NOT NULL,
	"failure_reason" "login_failure_reason",
	"ip_address" varchar(45),
	"country" varchar(100),
	"city" varchar(100),
	"region" varchar(100),
	"user_agent_raw" text,
	"browser" varchar(100),
	"os" varchar(100),
	"device" varchar(50),
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_history_user_id_idx" ON "login_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_history_email_idx" ON "login_history" USING btree ("email");--> statement-breakpoint
CREATE INDEX "login_history_status_idx" ON "login_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "login_history_created_at_idx" ON "login_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "login_history_ip_address_idx" ON "login_history" USING btree ("ip_address");