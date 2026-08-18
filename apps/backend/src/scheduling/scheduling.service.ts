import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

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
}
