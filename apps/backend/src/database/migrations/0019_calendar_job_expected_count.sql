-- Add expected_post_count to calendar_generation_jobs for idempotent validation
ALTER TABLE "calendar_generation_jobs" ADD COLUMN "expected_post_count" integer;
