import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as nodemailer from 'nodemailer';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { maskSecret, encryptSecret, decryptSecret } from '../../common/utils/encryption.util';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class EmailConfigService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getEmailConfig() {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    const { smtpPasswordEncrypted, ...rest } = config;
    return {
      ...rest,
      smtpPasswordMasked: smtpPasswordEncrypted ? maskSecret(smtpPasswordEncrypted) : null,
    };
  }

  async updateEmailConfig(dto: UpdateEmailConfigDto) {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    const updateData: any = { ...dto };
    if (dto.smtpPassword) {
      updateData.smtpPasswordEncrypted = encryptSecret(dto.smtpPassword);
      delete updateData.smtpPassword;
    }
    updateData.updatedAt = new Date();

    const [updated] = await this.db
      .update(schema.emailConfig)
      .set(updateData)
      .where(eq(schema.emailConfig.id, config.id))
      .returning();

    const { smtpPasswordEncrypted, ...rest } = updated;
    return {
      ...rest,
      smtpPasswordMasked: smtpPasswordEncrypted ? maskSecret(smtpPasswordEncrypted) : null,
    };
  }

  async sendTestEmail(dto: TestEmailDto) {
    const config = await this.db.query.emailConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Email config not found');
    }

    if (!config.smtpHost || !config.smtpUsername || !config.smtpPasswordEncrypted) {
      throw new BadRequestException('SMTP configuration is incomplete');
    }

    const plainPassword = decryptSecret(config.smtpPasswordEncrypted);

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUsername,
        pass: plainPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${config.senderName || 'SocialPilot AI'}" <${config.senderEmail}>`,
        replyTo: config.replyToEmail || undefined,
        to: dto.testRecipientEmail,
        subject: 'Test Email',
        text: 'This is a test email from SocialPilot AI settings',
      });
      return { success: true, message: 'Test email sent' };
    } catch (error) {
      console.error('Failed to send test email:', error);
      throw new InternalServerErrorException('Failed to send test email. Please check your SMTP configuration.');
    }
  }
}
