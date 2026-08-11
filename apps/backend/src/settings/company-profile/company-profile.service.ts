/**
 * CompanyProfileService
 * ---------------------
 * Business logic layer for the platform owner's company profile.
 *
 * The company profile is a singleton record in the `company_profile` table
 * (always exactly one row, seeded during initial setup).  All operations
 * therefore query/update the first — and only — record.
 *
 * Methods:
 *  getCompanyProfile()           — Fetches the company profile or throws 404.
 *  updateCompanyProfile(dto)     — Merges dto fields onto the existing record
 *                                  and stamps updatedAt.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

// Strongly-typed alias for the Drizzle database client
type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CompanyProfileService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Retrieves the single company profile row.
   *
   * @throws {NotFoundException} If the profile has not been seeded yet.
   * @returns The full company profile record.
   */
  async getCompanyProfile() {
    const profile = await this.db.query.companyProfile.findFirst();
    if (!profile) {
      // The profile should always exist after initial DB seed.
      // If it's missing, the admin needs to run the seed script.
      throw new NotFoundException('Company profile not found');
    }
    return profile;
  }

  /**
   * Updates the company profile with the provided fields.
   *
   * Internally calls getCompanyProfile() first to obtain the record ID,
   * then applies the DTO fields as a partial update.  The updatedAt timestamp
   * is always set to the current server time regardless of whether it was
   * included in the DTO.
   *
   * @param dto - Partial set of fields to update (only provided fields change).
   * @throws {NotFoundException} If no profile record exists.
   * @returns The updated company profile record.
   */
  async updateCompanyProfile(dto: UpdateCompanyProfileDto) {
    // Fetch first to get the ID — there is only ever one row
    const profile = await this.getCompanyProfile();

    const [updated] = await this.db
      .update(schema.companyProfile)
      .set({
        ...dto,
        updatedAt: new Date(), // always stamp the update time
      })
      .where(eq(schema.companyProfile.id, profile.id))
      .returning(); // return the full updated row

    return updated;
  }
}
