/**
 * SocialApiSettingsModule
 * -----------------------
 * NestJS feature module for managing OAuth 2.0 / API credentials for each
 * supported social media platform (Facebook, Instagram, Twitter/X, LinkedIn,
 * TikTok) stored in the `social_api_settings` table.
 *
 * Responsibilities:
 *  - Registers SocialApiSettingsController for the
 *    /api/admin/settings/social-api routes.
 *  - Provides SocialApiSettingsService which handles upsert logic (creates a
 *    new row if the platform has no credentials yet, updates otherwise),
 *    AES-encrypts client secrets at rest, and always returns masked values.
 *  - Exports SocialApiSettingsService so the social-accounts module can
 *    retrieve the live OAuth credentials when initiating platform flows.
 *
 * Security:
 *  - clientSecret is AES-encrypted via encryption.util before storage.
 *  - Masked values (e.g. "••••••••") are returned instead of raw secrets.
 *  - All endpoints are restricted to SUPER_ADMIN only.
 *
 * Platform catalogue:
 *  The service maintains a hard-coded list of VALID_PLATFORMS so invalid
 *  platform names are rejected before any DB operation is attempted.
 */
import { Module } from '@nestjs/common';
import { SocialApiSettingsController } from './social-api-settings.controller';
import { SocialApiSettingsService } from './social-api-settings.service';

@Module({
  controllers: [SocialApiSettingsController],
  providers: [SocialApiSettingsService],
  exports: [SocialApiSettingsService],
})
export class SocialApiSettingsModule {}
