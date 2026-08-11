/**
 * CustomerProfileService
 * ----------------------
 * Business logic layer for individual customer company profiles stored in
 * the `customer_company_profile` table (one row per user, identified by userId).
 *
 * Unlike CompanyProfileService (singleton admin profile), this service is
 * multi-tenant — each customer has their own row.
 *
 * Methods:
 *  getCompanyProfile(userId)              — Returns the customer's profile,
 *                                           or an empty shell if not yet created.
 *  updateCompanyProfile(userId, dto)      — Upserts the profile: updates if the
 *                                           row exists, inserts if it doesn't.
 */
import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateCustomerCompanyProfileDto } from './dto/update-customer-company-profile.dto';

// Strongly-typed alias for the Drizzle database client
type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CustomerProfileService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Returns the company profile for the given customer.
   *
   * Returns an empty shell object (id: null, all fields null/empty) if the
   * customer has never saved a profile.  This avoids a 404 response and lets
   * the frontend render an empty form without special error handling.
   *
   * @param userId - The authenticated customer's UUID.
   * @returns The profile record, or an empty shell object.
   */
  async getCompanyProfile(userId: string) {
    const profile = await this.db.query.customerCompanyProfile.findFirst({
      where: eq(schema.customerCompanyProfile.userId, userId),
    });

    // Return an empty shell so the frontend can detect "no profile yet"
    // without treating it as an error condition
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

  /**
   * Upserts the customer's company profile.
   *
   * If a row already exists for this userId, it is updated in-place.
   * If no row exists yet, a new one is inserted.
   *
   * The updatedAt timestamp is set automatically on updates.
   * On insert, Drizzle/Postgres sets createdAt and updatedAt via DEFAULT now().
   *
   * @param userId - The authenticated customer's UUID (taken from JWT, not body).
   * @param dto    - Fields to persist.
   * @returns The created or updated profile record.
   */
  async updateCompanyProfile(userId: string, dto: UpdateCustomerCompanyProfileDto) {
    // Check whether a profile row already exists for this customer
    const existing = await this.db.query.customerCompanyProfile.findFirst({
      where: eq(schema.customerCompanyProfile.userId, userId),
    });

    if (existing) {
      // UPDATE path — row already exists, apply the DTO fields as a partial update
      const [updated] = await this.db
        .update(schema.customerCompanyProfile)
        .set({
          ...dto,
          updatedAt: new Date(), // stamp update time manually
        })
        .where(eq(schema.customerCompanyProfile.id, existing.id))
        .returning();
      return updated;
    } else {
      // INSERT path — first time this customer is saving a profile
      const [inserted] = await this.db
        .insert(schema.customerCompanyProfile)
        .values({
          ...dto,
          userId, // associate the row with the customer (taken from JWT)
        })
        .returning();
      return inserted;
    }
  }
}
