import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class NotificationPreferencesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getNotificationPreferences(userId: string) {
    const globalSettings = await this.db.query.notificationTypeSettings.findMany({
      where: eq(schema.notificationTypeSettings.isEnabledGlobally, true),
    });

    const userPreferences = await this.db.query.notificationPreferences.findMany({
      where: eq(schema.notificationPreferences.userId, userId),
    });

    const preferencesMap = new Map(
      userPreferences.map((pref) => [pref.notificationType, pref])
    );

    return globalSettings.map((globalSetting) => {
      const userPref = preferencesMap.get(globalSetting.notificationType);

      return {
        notificationType: globalSetting.notificationType,
        emailEnabled: userPref?.emailEnabled ?? true,
        inAppEnabled: userPref?.inAppEnabled ?? true,
        whatsappEnabled: userPref?.whatsappEnabled ?? false,
        emailAvailable: globalSetting.emailAvailable,
        inAppAvailable: globalSetting.inAppAvailable,
        whatsappAvailable: globalSetting.whatsappAvailable,
      };
    });
  }

  async updateNotificationPreference(
    userId: string,
    notificationType: string,
    dto: UpdateNotificationPreferenceDto,
  ) {
    const globalSetting = await this.db.query.notificationTypeSettings.findFirst({
      where: eq(schema.notificationTypeSettings.notificationType, notificationType),
    });

    if (!globalSetting) {
      throw new NotFoundException(`Notification type '${notificationType}' not found`);
    }

    if (!globalSetting.isEnabledGlobally) {
      throw new BadRequestException('This notification type is currently disabled platform-wide');
    }

    if (dto.emailEnabled === true && !globalSetting.emailAvailable) {
      throw new BadRequestException('Email is not available for this notification type');
    }
    if (dto.inAppEnabled === true && !globalSetting.inAppAvailable) {
      throw new BadRequestException('In-app is not available for this notification type');
    }
    if (dto.whatsappEnabled === true && !globalSetting.whatsappAvailable) {
      throw new BadRequestException('WhatsApp is not available for this notification type');
    }

    const existing = await this.db.query.notificationPreferences.findFirst({
      where: and(
        eq(schema.notificationPreferences.userId, userId),
        eq(schema.notificationPreferences.notificationType, notificationType)
      ),
    });

    if (existing) {
      const [updated] = await this.db
        .update(schema.notificationPreferences)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(schema.notificationPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await this.db
        .insert(schema.notificationPreferences)
        .values({
          userId,
          notificationType,
          emailEnabled: dto.emailEnabled ?? true,
          inAppEnabled: dto.inAppEnabled ?? true,
          whatsappEnabled: dto.whatsappEnabled ?? false,
        })
        .returning();
      return inserted;
    }
  }
}
