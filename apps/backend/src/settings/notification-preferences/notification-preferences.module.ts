/**
 * NotificationPreferencesModule
 * ------------------------------
 * NestJS feature module that lets individual customers customise which
 * notification channels (email, in-app, WhatsApp) they receive for each
 * notification type.
 *
 * Architecture distinction:
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │  NotificationSettingsModule  ← Admin controls GLOBAL settings   │
 *  │  NotificationPreferencesModule ← Customer controls OWN prefs   │
 *  └─────────────────────────────────────────────────────────────────┘
 *
 * Responsibilities:
 *  - Registers NotificationPreferencesController for the
 *    /api/profile/notification-preferences routes.
 *  - Provides NotificationPreferencesService which merges the global
 *    notification type catalogue with per-user overrides stored in the
 *    `notification_preferences` table.
 *  - Exports NotificationPreferencesService in case a notification
 *    dispatcher needs to check a customer's preferences before sending.
 *
 * Access control:
 *  - Protected by JwtAuthGuard only — no admin role required.
 *  - Each customer can only read/update their own preferences
 *    (userId is extracted from the JWT, never from the request body).
 */
import { Module } from '@nestjs/common';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';

@Module({
  controllers: [NotificationPreferencesController],
  providers: [NotificationPreferencesService],
  exports: [NotificationPreferencesService],
})
export class NotificationPreferencesModule {}
