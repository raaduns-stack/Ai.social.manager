import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateCustomerCompanyProfileDto } from './dto/update-customer-company-profile.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CustomerProfileService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getCompanyProfile(userId: string) {
    const profile = await this.db.query.customerCompanyProfile.findFirst({
      where: eq(schema.customerCompanyProfile.userId, userId),
    });

    if (!profile) {
      return {
        id: null,
        userId,
        businessName: '',
        businessDescription: null,
        industry: null,
        website: null,
        contactEmail: null,
        contactPhone: null,
        addressLine1: null,
        city: null,
        country: null,
        logoUrl: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    return profile;
  }

  async updateCompanyProfile(userId: string, dto: UpdateCustomerCompanyProfileDto) {
    const existing = await this.db.query.customerCompanyProfile.findFirst({
      where: eq(schema.customerCompanyProfile.userId, userId),
    });

    if (existing) {
      const [updated] = await this.db
        .update(schema.customerCompanyProfile)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(schema.customerCompanyProfile.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await this.db
        .insert(schema.customerCompanyProfile)
        .values({
          ...dto,
          userId,
        })
        .returning();
      return inserted;
    }
  }
}
