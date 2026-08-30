import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateSocialApiSettingDto } from './dto/update-social-api-setting.dto';
import { encryptSecret, maskSecret } from '../../common/utils/encryption.util';

type Database = PostgresJsDatabase<typeof schema>;

const VALID_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'discord'];

@Injectable()
export class SocialApiSettingsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getSocialApiSettings() {
    const settings = await this.db.query.socialApiSettings.findMany();
    
    const settingsMap = new Map(
      settings.map(s => [s.platform, s])
    );

    return VALID_PLATFORMS.map(platform => {
      const existing = settingsMap.get(platform);
      if (existing) {
        const { clientSecretEncrypted, ...rest } = existing;
        return {
          ...rest,
          clientSecretMasked: clientSecretEncrypted ? maskSecret(clientSecretEncrypted) : null,
        };
      }

      return {
        id: null,
        platform,
        clientId: null,
        clientSecretMasked: null,
        redirectUri: null,
        isEnabled: false,
        createdAt: null,
        updatedAt: null,
      };
    });
  }

  async updateSocialApiSetting(platform: string, dto: UpdateSocialApiSettingDto) {
    if (!VALID_PLATFORMS.includes(platform)) {
      throw new BadRequestException(`Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`);
    }

    const existing = await this.db.query.socialApiSettings.findFirst({
      where: eq(schema.socialApiSettings.platform, platform),
    });

    const updateData: any = {
      clientId: dto.clientId,
      redirectUri: dto.redirectUri,
      isEnabled: dto.isEnabled,
    };

    if (dto.clientSecret) {
      updateData.clientSecretEncrypted = encryptSecret(dto.clientSecret);
    }

    // Clean up undefined values so we don't accidentally override with nulls
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    let result;

    if (existing) {
      const [updated] = await this.db
        .update(schema.socialApiSettings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(schema.socialApiSettings.id, existing.id))
        .returning();
      result = updated;
    } else {
      const [inserted] = await this.db
        .insert(schema.socialApiSettings)
        .values({
          platform,
          ...updateData,
        })
        .returning();
      result = inserted;
    }

    const { clientSecretEncrypted, ...rest } = result;
    return {
      ...rest,
      clientSecretMasked: clientSecretEncrypted ? maskSecret(clientSecretEncrypted) : null,
    };
  }
}
