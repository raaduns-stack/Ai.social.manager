-- Migration: Add 'discord' to social_platform enum
-- Enables Discord as a supported social channel platform in RaaSocial.
ALTER TYPE "public"."social_platform" ADD VALUE IF NOT EXISTS 'discord';
