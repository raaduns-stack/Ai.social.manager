CREATE TYPE "public"."feedback_reaction" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TYPE "public"."suggestion_type" AS ENUM('caption', 'idea');--> statement-breakpoint
CREATE TABLE "content_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" "feedback_reaction" NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "suggestion_type" NOT NULL,
	"content" varchar(1000) NOT NULL,
	"hashtags" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_feedback" ADD CONSTRAINT "content_feedback_suggestion_id_content_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."content_suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_feedback" ADD CONSTRAINT "content_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_suggestions" ADD CONSTRAINT "content_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;