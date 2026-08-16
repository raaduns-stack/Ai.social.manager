/**
 * EmailConfigController
 * ---------------------
 * REST controller for the platform's outgoing SMTP email configuration.
 * Base route: /api/admin/settings/email
 *
 * All routes require:
 *  - A valid JWT access token (JwtAuthGuard)
 *  - SUPER_ADMIN role (RolesGuard + @Roles decorator)
 *
 * Endpoints:
 *  GET  /      — Fetch current email config (password is masked, never plain text).
 *  PATCH /     — Update SMTP host, port, credentials, sender info, etc.
 *  POST /test  — Send a live test email to a specified recipient address to
 *                verify the current SMTP configuration is working.
 */
import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailConfigService } from './email-config.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/email')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  /**
   * GET /api/admin/settings/email
   * Returns the current SMTP configuration.
   * The smtpPassword is never returned in plain text — only a masked value
   * (e.g. "••••••••") is included so the admin can confirm a password exists
   * without the UI exposing the secret.
   *
   * Accessible to: SUPER_ADMIN only
   * @throws {NotFoundException} If no email config row exists.
   */
  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get email configuration' })
  getEmailConfig() {
    return this.emailConfigService.getEmailConfig();
  }

  /**
   * PATCH /api/admin/settings/email
   * Updates the SMTP configuration.  If smtpPassword is provided in the body,
   * it is AES-encrypted before being stored; the plain-text value is discarded.
   * Fields not included in the body retain their existing values.
   *
   * Accessible to: SUPER_ADMIN only
   * @param dto - Partial SMTP config fields to update.
   * @throws {NotFoundException} If no email config row exists.
   */
  @Patch()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update email configuration' })
  updateEmailConfig(@Body() dto: UpdateEmailConfigDto) {
    return this.emailConfigService.updateEmailConfig(dto);
  }

  /**
   * POST /api/admin/settings/email/test
   * Sends a live test email using the currently saved SMTP configuration.
   * This lets the admin verify credentials are correct before relying on
   * automated email features (password resets, invoice emails, etc.).
   *
   * Accessible to: SUPER_ADMIN only
   * @param dto - Contains testRecipientEmail — the address to send the test to.
   * @throws {NotFoundException}           If no email config exists.
   * @throws {BadRequestException}         If SMTP credentials are incomplete.
   * @throws {InternalServerErrorException} If nodemailer fails to send.
   */
  @Post('test')
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Send a test email using current configuration' })
  sendTestEmail(@Body() dto: TestEmailDto) {
    return this.emailConfigService.sendTestEmail(dto);
  }
}

