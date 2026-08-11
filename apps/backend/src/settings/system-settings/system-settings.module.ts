/**
 * SystemSettingsModule
 * --------------------
 * NestJS feature module for platform-level operational settings stored in
 * the singleton `system_settings` table row (there is always exactly one row).
 *
 * Controlled settings include:
 *  - defaultTimezone      — platform-wide default for scheduling & display
 *  - maintenanceMode      — when true, the platform shows a maintenance page
 *  - allowNewRegistrations — gates the public Sign-Up endpoint
 *  - contentApprovalRequired — whether posts need admin approval before publish
 *  - dateFormat           — the display format used across the admin UI
 *
 * Responsibilities:
 *  - Registers SystemSettingsController for /api/admin/settings/system routes.
 *  - Provides SystemSettingsService as a singleton injectable.
 *  - Exports SystemSettingsService so other modules (e.g. AppModule guard,
 *    auth service) can read maintenanceMode or allowNewRegistrations at runtime.
 *
 * Access control:
 *  - GET  — SUPER_ADMIN or ACCOUNT_MANAGER can read system settings.
 *  - PATCH — Only SUPER_ADMIN can modify system settings.
 */
import { Module } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
