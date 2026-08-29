ALTER TABLE "users" ALTER COLUMN "account_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "account_status" SET DEFAULT 'EMAIL_VERIFICATION_PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."account_status";--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('EMAIL_VERIFICATION_PENDING', 'REGISTRATION_IN_PROGRESS', 'ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "account_status" SET DEFAULT 'EMAIL_VERIFICATION_PENDING'::"public"."account_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "account_status" SET DATA TYPE "public"."account_status" USING "account_status"::"public"."account_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;