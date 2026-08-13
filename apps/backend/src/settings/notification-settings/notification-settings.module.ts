/**
 * NotificationSettingsModule
 * --------------------------
 * NestJS feature module for platform-wide (admin-level) notification
 * type configuration stored in the `notification_type_settings` table.
 *
 * Architecture distinction:
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │  NotificationSettingsModule  ← Admin controls GLOBAL settings   │
 *  │  NotificationPreferencesModule ← Customer controls OWN prefs   │
 *  └─────────────────────────────────────────────────────────────────┘
 *
 * Responsibilities:
 *  - Registers NotificationSettingsController for the
 *    /api/admin/settings/notifications routes.
 *  - Provides NotificationSettingsService which lets super admins toggle
 *    which notification channels are available per notification type and
 *    whether a type is enabled platform-wide.
 *  - Exports NotificationSettingsService so NotificationPreferencesService
 *    can cross-reference global availability when a customer updates prefs.
 *
 * Access control:
 *  - GET  — SUPER_ADMIN or ACCOUNT_MANAGER can view all type settings.
 *  - PATCH — Only SUPER_ADMIN can modify the platform-wide toggles.
 */
import { Module } from '@nestjs/common';
import { NotificationSettingsController } from './notification-settings.controller';
import { NotificationSettingsService } from './notification-settings.service';

@Module({
  controllers: [NotificationSettingsController],
  providers: [NotificationSettingsService],
  exports: [NotificationSettingsService],
})
export class NotificationSettingsModule {}
