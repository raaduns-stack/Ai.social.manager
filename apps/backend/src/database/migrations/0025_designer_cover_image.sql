-- Designer profile cover banner (Track C). Additive only: nullable column, no backfill.
-- Generated via drizzle-kit produced a full-baseline rewrite (snapshot drift, pre-existing),
-- so this follows the hand-written precedent (0019_calendar_job_expected_count.sql).
-- NOT applied to shared DB here - deploys apply via db:migrate.
ALTER TABLE "designer_profiles" ADD COLUMN "cover_image" varchar(500);
