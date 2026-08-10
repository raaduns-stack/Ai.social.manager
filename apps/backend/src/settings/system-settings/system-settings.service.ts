import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SystemSettingsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getSystemSettings() {
    const settings = await this.db.query.systemSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('System settings not found');
    }
    return settings;
  }

  async updateSystemSettings(dto: UpdateSystemSettingsDto) {
    const settings = await this.getSystemSettings();

    const [updated] = await this.db
      .update(schema.systemSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.systemSettings.id, settings.id))
      .returning();

    return updated;
  }
}
