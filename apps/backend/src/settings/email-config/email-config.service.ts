/**
 * EmailConfigService
 * ------------------
 * Business logic for managing the platform's outgoing SMTP email settings.
 *
 * Security model:
 *  - SMTP passwords are stored AES-encrypted in the `smtp_password_encrypted`
 *    column using encryption.util helpers (encryptSecret / decryptSecret).
 *  - Plain-text passwords are NEVER returned to the client — only masked
 *    strings (e.g. "sk_••••••••") via maskSecret().
 *  - Decryption happens only in sendTestEmail() when nodemailer needs the
 *    actual credential, and the plain value is kept in local scope only.
 *
 * Database:
 *  - The email_config table has a single row (singleton pattern).
 *  - All methods query for the first row and reject if none is found
 *    (the row must be seeded during initial setup).
 *
 * Methods:
 *  getEmailConfig()         — Fetches config, strips encrypted field, adds masked version.
 *  updateEmailConfig(dto)   — Applies partial update; encrypts new password if provided.
 *  sendTestEmail(dto)       — Builds a live nodemailer transport and sends a test message.
 */
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as nodemailer from 'nodemailer';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { maskSecret, encryptSecret, decryptSecret } from '../../common/utils/encryption.util';

// Strongly-typed alias for the Drizzle database client
type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class EmailConfigService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Retrieves the email configuration record.
   *
   * The encrypted SMTP password is stripped from the response and replaced
   * with a masked representation so the admin can see a password exists
   * without the raw encrypted value being exposed over the network.
   *
   * @throws {NotFoundException} If the email config row hasn't been seeded.
   * @returns Config record with smtpPasswordMasked instead of smtpPasswordEncrypted.
   */
  async getEmailConfig() {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    // Destructure to remove the encrypted field from the response payload
    const { smtpPasswordEncrypted, ...rest } = config;
    return {
      ...rest,
      // Replace with a UI-safe masked value (e.g. "••••1234") — never raw
      smtpPasswordMasked: smtpPasswordEncrypted ? maskSecret(smtpPasswordEncrypted) : null,
    };
  }

  /**
   * Updates the email configuration with the provided fields.
   *
   * If smtpPassword is included in the DTO, it is AES-encrypted via
   * encryptSecret() before being written to smtpPasswordEncrypted.
   * The plain-text value is deleted from the update object immediately after.
   * Fields absent from the DTO are left unchanged.
   *
   * @param dto - Partial SMTP configuration fields to update.
   * @throws {NotFoundException} If no email config row exists.
   * @returns Updated config with masked password (same shape as getEmailConfig).
   */
  async updateEmailConfig(dto: UpdateEmailConfigDto) {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    // Build the update payload — start with all DTO fields
    const updateData: any = { ...dto };

    if (dto.smtpPassword) {
      // Encrypt the plain-text password and store it in the correct column
      updateData.smtpPasswordEncrypted = encryptSecret(dto.smtpPassword);
      // Remove the plain-text field — it must not be written to the DB
      delete updateData.smtpPassword;
    }

    // Always stamp the update timestamp
    updateData.updatedAt = new Date();

    const [updated] = await this.db
      .update(schema.emailConfig)
      .set(updateData)
      .where(eq(schema.emailConfig.id, config.id))
      .returning();

    // Strip encrypted field from response, same as getEmailConfig()
    const { smtpPasswordEncrypted, ...rest } = updated;
    return {
      ...rest,
      smtpPasswordMasked: smtpPasswordEncrypted ? maskSecret(smtpPasswordEncrypted) : null,
    };
  }

  /**
   * Sends a test email using the currently saved SMTP configuration.
   *
   * Flow:
   *  1. Load the email config and validate it is complete.
   *  2. Decrypt the stored SMTP password using decryptSecret().
   *  3. Build a transient nodemailer transport (not cached — avoids stale state).
   *  4. Send a plain-text test message to the recipient specified in dto.
   *  5. Return a success response, or throw a 500 if nodemailer fails.
   *
   * @param dto - Contains testRecipientEmail (the address to receive the test).
   * @throws {NotFoundException}            If no email config exists.
   * @throws {BadRequestException}          If SMTP host, username, or password is missing.
   * @throws {InternalServerErrorException} If the email fails to send (SMTP error, auth failure, etc.).
   */
  async sendTestEmail(dto: TestEmailDto) {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    // Guard: ensure the minimum required SMTP fields are present before attempting a send
    if (!config.smtpHost || !config.smtpUsername || !config.smtpPasswordEncrypted) {
      throw new BadRequestException('SMTP configuration is incomplete');
    }

    // Decrypt the password only within this method's scope — never stored as a property
    const plainPassword = decryptSecret(config.smtpPasswordEncrypted);

    // Create a one-shot transporter using the stored config values
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,       // fall back to standard TLS submission port
      secure: config.smtpSecure || false, // true = SSL on port 465, false = STARTTLS
      auth: {
        user: config.smtpUsername,
        pass: plainPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${config.senderName || 'SocialPilot AI'}" <${config.senderEmail}>`,
        replyTo: config.replyToEmail || undefined, // omit header if no reply-to configured
        to: dto.testRecipientEmail,
        subject: 'Test Email',
        text: 'This is a test email from SocialPilot AI settings',
      });
      return { success: true, message: 'Test email sent' };
    } catch (error) {
      // Log the full error server-side for debugging (auth failures, connection timeouts, etc.)
      console.error('Failed to send test email:', error);
      throw new InternalServerErrorException(
        'Failed to send test email. Please check your SMTP configuration.',
      );
    }
  }
}
