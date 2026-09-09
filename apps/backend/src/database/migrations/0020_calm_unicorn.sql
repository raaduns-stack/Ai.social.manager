CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'SCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'IN_APP', 'BOTH', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('SYSTEM_ANNOUNCEMENT', 'MAINTENANCE', 'CONTENT_APPROVAL', 'CONTENT_PUBLISHED', 'CONTENT_PUBLISH_FAILED', 'SUBSCRIPTION_RENEWAL_REMINDER', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_PAYMENT_SUCCESS', 'SUBSCRIPTION_PAYMENT_FAILED', 'SUBSCRIPTION_INVOICE_AVAILABLE', 'ACCOUNT_CONNECTION_DISCONNECTED', 'ACCOUNT_CONNECTION_REAUTHORIZATION_REQUIRED', 'ACCOUNT_CONNECTION_RECONNECTED', 'CALENDAR_UPLOADED', 'TICKET_RECEIVED', 'TICKET_ASSIGNED', 'TICKET_RESPONDED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'SECURITY_NOTICE', 'FEATURE_UPDATE', 'SERVICE_UPDATE');--> statement-breakpoint
CREATE TYPE "public"."scheduled_notification_status" AS ENUM('PENDING', 'DISPATCHED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "scheduled_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_by_id" uuid,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"scheduled_for" timestamp NOT NULL,
	"repeat_interval" varchar(50),
	"repeat_until" timestamp,
	"status" "scheduled_notification_status" DEFAULT 'PENDING' NOT NULL,
	"last_attempted_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "channel" SET DATA TYPE "public"."notification_channel";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "status" SET DATA TYPE "public"."delivery_status";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'SENT';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_entity_type" varchar(100);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;