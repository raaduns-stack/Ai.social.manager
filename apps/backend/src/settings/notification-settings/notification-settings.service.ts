import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateNotificationTypeSettingsDto } from './dto/update-notification-type-settings.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class NotificationSettingsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getAllNotificationSettings() {
    return this.db.query.notificationTypeSettings.findMany();
  }

  async updateNotificationSetting(notificationType: string, dto: UpdateNotificationTypeSettingsDto) {
    const existing = await this.db.query.notificationTypeSettings.findFirst({
      where: eq(schema.notificationTypeSettings.notificationType, notificationType),
    });

    if (!existing) {
      throw new NotFoundException(`Notification type '${notificationType}' not found`);
    }

    const [updated] = await this.db
      .update(schema.notificationTypeSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.notificationTypeSettings.id, existing.id))
      .returning();

    return updated;
  }
}
