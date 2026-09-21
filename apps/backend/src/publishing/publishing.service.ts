import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { PublishingLogEntry } from '@socialpilot/shared-types';
import { TumblrService } from '../channels/tumblr/tumblr.service';
import { DiscordService } from '../channels/discord/discord.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly tumblrService: TumblrService,
    private readonly discordService: DiscordService,
  ) {}

  async dispatchPost(body: {
    scheduledPostId: string;
    platform: string;
    content: string;
    mediaUrl: string | null;
    socialAccountId: string;
    idempotencyKey: string | null;
    userId?: string;
  }) {
    const platformLower = body.platform.toLowerCase();

    // Look up social account details to resolve userId if not explicitly provided
    let userId = body.userId;
    let targetChannelId = '';
    let targetBlogName = '';

    if (body.socialAccountId) {
      const socialAccount = await this.db.query.social_accounts.findFirst({
        where: eq(schema.social_accounts.id, body.socialAccountId),
      });
      if (socialAccount) {
        userId = socialAccount.userId;
        targetBlogName = socialAccount.accountHandle || '';
      }
    }

    if (platformLower === 'tumblr' && userId) {
      this.logger.log(`Dispatching post to Tumblr for user ${userId}`);
      const res = await this.tumblrService.sendPost(userId, {
        blogName: targetBlogName,
        content: body.content,
        mediaUrl: body.mediaUrl || undefined,
      });
      return {
        success: true,
        externalPostId: res.postId,
        postUrl: res.postUrl,
      };
    }

    if (platformLower === 'discord' && userId) {
      this.logger.log(`Dispatching post to Discord for user ${userId}`);
      const res = await this.discordService.sendMessage(
        userId,
        targetChannelId,
        body.content,
      );
      return {
        success: true,
        externalPostId: res.messageId,
      };
    }

    // Mock fallback for other platforms without real adapters yet
    const mockPostId = `mock-${platformLower}-${Date.now()}`;
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
