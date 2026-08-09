import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CompanyProfileService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getCompanyProfile() {
    const profile = await this.db.query.companyProfile.findFirst();
    if (!profile) {
      throw new NotFoundException('Company profile not found');
    }
    return profile;
  }

  async updateCompanyProfile(dto: UpdateCompanyProfileDto) {
    const profile = await this.getCompanyProfile();

    const [updated] = await this.db
      .update(schema.companyProfile)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.companyProfile.id, profile.id))
      .returning();

    return updated;
  }
}
