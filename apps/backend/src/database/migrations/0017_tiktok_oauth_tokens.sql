-- Migration: Add OAuth token columns to social_accounts
-- These columns store encrypted (AES-256-GCM) access and refresh tokens
-- for OAuth-connected social platforms (e.g. TikTok Login Kit).
-- Both columns are nullable so existing rows are unaffected.
ALTER TABLE "social_accounts" ADD COLUMN "access_token" text;
ALTER TABLE "social_accounts" ADD COLUMN "refresh_token" text;
