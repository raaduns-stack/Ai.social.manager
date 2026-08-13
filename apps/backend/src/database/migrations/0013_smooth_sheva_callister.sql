CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"registration_number" varchar(100),
	"business_type" varchar(100) NOT NULL,
	"business_address" text NOT NULL,
	"country" varchar(100) NOT NULL,
	"business_email" varchar(255) NOT NULL,
	"business_phone" varchar(50) NOT NULL,
	"business_description" text NOT NULL,
	"cert_of_registration_path" varchar(500),
	"utility_bill_path" varchar(500),
	"owner_id_path" varchar(500),
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD COLUMN "post_id" uuid;--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "content_calendar" ADD COLUMN "selected_suggestion_id" uuid;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD CONSTRAINT "content_suggestions_post_id_content_calendar_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_calendar"("id") ON DELETE cascade ON UPDATE no action;