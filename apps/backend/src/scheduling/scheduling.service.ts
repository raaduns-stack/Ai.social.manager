import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateScheduledPostDto } from './dto/create-scheduled-post.dto';
import * as crypto from 'crypto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SchedulingService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findDuePosts() {
    return this.db
      .select()
      .from(schema.scheduledPosts)
      .where(
        and(
          eq(schema.scheduledPosts.status, 'SCHEDULED'),
          lte(schema.scheduledPosts.scheduledAt, new Date()),
        ),
      );
  }

  async claimPost(id: string, idempotencyKey: string | null) {
    const updatedRows = await this.db
      .update(schema.scheduledPosts)
      .set({
        status: 'PROCESSING',
        idempotencyKey: idempotencyKey || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.scheduledPosts.scheduledPostId, id),
          eq(schema.scheduledPosts.status, 'SCHEDULED'),
        ),
      )
      .returning();

    if (updatedRows.length > 0) {
      return { claimed: true };
    } else {
      return { claimed: false, reason: 'already_claimed' };
    }
  }

  async createScheduledPost(dto: CreateScheduledPostDto) {
    const { variationId, customerId, platform, content, scheduledFor } = dto;

    // 1. Idempotency Check: look up existing post with variationId
    const existing = await this.db.query.scheduledPosts.findFirst({
      where: eq(schema.scheduledPosts.variationId, variationId),
    });

    if (existing) {
      // Gracefully handle duplicates by returning the existing record
      return existing;
    }

    // 2. Find customer's connected social account for platform
    const normalizedPlatform = platform.toLowerCase();
    const socialAccount = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, customerId),
        eq(schema.social_accounts.platform, normalizedPlatform as any),
      ),
    });

    if (!socialAccount) {
      throw new BadRequestException(
        `No connected social account found for customer ID ${customerId} on platform "${platform}".`,
      );
    }

    // 3. Create scheduled post
    const [inserted] = await this.db
      .insert(schema.scheduledPosts)
      .values({
        calendarPostId: crypto.randomUUID(), // Fill notNull field with deterministic unique post reference
        variationId,
        socialAccountId: socialAccount.id,
        platform,
        content,
        scheduledAt: new Date(scheduledFor),
        status: 'SCHEDULED',
      })
      .returning();

    return inserted;
  }
}
