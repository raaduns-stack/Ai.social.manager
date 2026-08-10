import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdatePaymentGatewaySettingsDto } from './dto/update-payment-gateway-settings.dto';
import { encryptSecret, maskSecret } from '../../common/utils/encryption.util';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PaymentGatewaySettingsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getPaymentGatewaySettings() {
    const settings = await this.db.query.paymentGatewaySettings.findFirst();
    
    if (!settings) {
      throw new NotFoundException('Payment gateway settings not found');
    }

    const { secretKeyEncrypted, webhookSecretEncrypted, ...rest } = settings;
    
    return {
      ...rest,
      secretKeyMasked: secretKeyEncrypted ? maskSecret(secretKeyEncrypted) : null,
      webhookSecretMasked: webhookSecretEncrypted ? maskSecret(webhookSecretEncrypted) : null,
    };
  }

  async updatePaymentGatewaySettings(dto: UpdatePaymentGatewaySettingsDto) {
    const existing = await this.db.query.paymentGatewaySettings.findFirst();
    
    if (!existing) {
      throw new NotFoundException('Payment gateway settings not found');
    }

    const updateData: any = {
      publicKey: dto.publicKey,
      supportedMethods: dto.supportedMethods,
      isLiveMode: dto.isLiveMode,
      isEnabled: dto.isEnabled,
    };

    if (dto.secretKey) {
      updateData.secretKeyEncrypted = encryptSecret(dto.secretKey);
    }
    
    if (dto.webhookSecret) {
      updateData.webhookSecretEncrypted = encryptSecret(dto.webhookSecret);
    }

    // Clean up undefined values so we don't accidentally override with nulls
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    const [updated] = await this.db
      .update(schema.paymentGatewaySettings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.paymentGatewaySettings.id, existing.id))
      .returning();

    const { secretKeyEncrypted, webhookSecretEncrypted, ...rest } = updated;
    
    return {
      ...rest,
      secretKeyMasked: secretKeyEncrypted ? maskSecret(secretKeyEncrypted) : null,
      webhookSecretMasked: webhookSecretEncrypted ? maskSecret(webhookSecretEncrypted) : null,
    };
  }
}
