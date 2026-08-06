import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SocialAccountsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Create a new social account linked to the given user.
   */
  async create(userId: string, dto: CreateSocialAccountDto) {
    const [account] = await this.db
      .insert(schema.social_accounts)
      .values({
        userId,
        platform: dto.platform,
        accountHandle: dto.accountHandle,
        // New accounts start as connected; status can be updated later.
        status: 'connected',
        connectedAt: new Date(),
      })
      .returning();
    return account;
  }

  /** Return all social accounts belonging to the given user. */
  async findAll(userId: string) {
    return this.db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
    });
  }

  /** Update status and token expiration for a specific social account. */
  async update(userId: string, id: string, dto: UpdateSocialAccountDto) {
    const allowedUpdates: Partial<Record<keyof UpdateSocialAccountDto, any>> = {};
    if (dto.status !== undefined) allowedUpdates.status = dto.status;
    if (dto.tokenExpiresAt !== undefined) allowedUpdates.tokenExpiresAt = dto.tokenExpiresAt;

    const [updated] = await this.db
      .update(schema.social_accounts)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.social_accounts.id, id), eq(schema.social_accounts.userId, userId)))
      .returning();
    if (!updated) {
      throw new NotFoundException('Social account not found');
    }
    return updated;
  }

  /** Delete a social account record. */
  async remove(userId: string, id: string) {
    const [deleted] = await this.db
      .delete(schema.social_accounts)
      .where(and(eq(schema.social_accounts.id, id), eq(schema.social_accounts.userId, userId)))
      .returning();
    if (!deleted) {
      throw new NotFoundException('Social account not found');
    }
    return deleted;
  }
}
