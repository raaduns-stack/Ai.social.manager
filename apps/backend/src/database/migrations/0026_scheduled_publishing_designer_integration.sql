ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "calendar_post_id" uuid;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "customer_id" uuid;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_calendar_post_id_content_calendar_id_fk" FOREIGN KEY ("calendar_post_id") REFERENCES "content_calendar"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "designer_task_id" uuid;
ALTER TABLE "content_calendar" ADD COLUMN IF NOT EXISTS "designer_submission_id" uuid;

DO $$ BEGIN
  ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_designer_task_id_tasks_id_fk" FOREIGN KEY ("designer_task_id") REFERENCES "tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_designer_submission_id_submissions_id_fk" FOREIGN KEY ("designer_submission_id") REFERENCES "submissions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "scheduled_posts" ADD COLUMN IF NOT EXISTS "designer_submission_id" uuid;
ALTER TABLE "scheduled_posts" ADD COLUMN IF NOT EXISTS "has_designer_asset" boolean DEFAULT false NOT NULL;
ALTER TABLE "scheduled_posts" ADD COLUMN IF NOT EXISTS "retry_count" integer DEFAULT 0 NOT NULL;

DO $$ BEGIN
  ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_designer_submission_id_submissions_id_fk" FOREIGN KEY ("designer_submission_id") REFERENCES "submissions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
