/**
 * EmailConfigModule
 * -----------------
 * NestJS feature module for managing the platform's outgoing email (SMTP)
 * configuration stored in the `email_config` database table.
 *
 * Responsibilities:
 *  - Registers EmailConfigController for /api/admin/settings/email routes.
 *  - Provides EmailConfigService which handles reading, writing, and
 *    encrypting SMTP credentials, plus sending a live test email.
 *  - Exports EmailConfigService so the MailerModule or other services
 *    can retrieve the live SMTP settings at runtime without re-querying.
 *
 * Security:
 *  - SMTP passwords are AES-encrypted at rest via encryption.util.
 *  - Only the SUPER_ADMIN role can read or update email configuration.
 *  - Passwords are never returned in plain text — only masked values
 *    (e.g. "••••••••") are sent to the client.
 */
import { Module } from '@nestjs/common';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';

@Module({
  controllers: [EmailConfigController],
  providers: [EmailConfigService],
  exports: [EmailConfigService],
})
export class EmailConfigModule {}
