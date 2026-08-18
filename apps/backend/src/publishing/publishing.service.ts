import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { PublishingLogEntry } from '@socialpilot/shared-types';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PublishingService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async dispatchPost(body: {
    scheduledPostId: string;
    platform: string;
    content: string;
    mediaUrl: string | null;
    socialAccountId: string;
    idempotencyKey: string | null;
  }) {
    // TODO: real platform API calls (branched by platform) go here later
    const mockPostId = `mock-${body.platform.toLowerCase()}-${Date.now()}`;
    return {
      success: true,
      externalPostId: mockPostId,
    };
  }

  async createLogEntry(entry: PublishingLogEntry) {
    return this.db.transaction(async (tx) => {
      // 1. Insert the publishing log
      await tx.insert(schema.publishingLogs).values({
        scheduledPostId: entry.scheduledPostId,
        status: entry.status,
        externalPostId: entry.externalPostId || null,
        error: entry.error || null,
        attemptedAt: new Date(entry.attemptedAt),
      });

      // 2. Update the corresponding ScheduledPost's status
      await tx
        .update(schema.scheduledPosts)
        .set({
          status: entry.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.scheduledPosts.scheduledPostId, entry.scheduledPostId));

      return { success: true };
    });
  }
}
