import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, asc, eq, lte, notInArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { ContentSuggestionsService } from '../../content-suggestions/content-suggestions.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AutoApprovePostsJob {
  private readonly logger = new Logger(AutoApprovePostsJob.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly contentSuggestionsService: ContentSuggestionsService,
  ) {}

  @Cron('0 * * * *') // Run hourly
  async handleCron() {
    this.logger.debug('Running auto-approve-posts fallback job...');

    try {
      // 1. Fetch system settings
      const settings = await this.db.query.systemSettings.findFirst();
      const autoApproveEnabled = settings?.autoApproveEnabled ?? true;
      const windowHours = settings?.autoApproveWindowHours ?? 24;

      if (!autoApproveEnabled) {
        this.logger.log('[AutoApprove] Auto-approval is disabled in system settings. Skipping job.');
        return;
      }

      // 2. Compute grace window cutoff time
      const windowCutoff = new Date(Date.now() + windowHours * 60 * 60 * 1000);

      // 3. Find candidate pending calendar posts within the grace window
      const pendingPosts = await this.db.query.contentCalendar.findMany({
        where: and(
          eq(schema.contentCalendar.approvalStatus, 'PENDING'),
          lte(schema.contentCalendar.scheduledAt, windowCutoff),
        ),
      });

      if (pendingPosts.length === 0) {
        this.logger.debug('[AutoApprove] No pending posts found within the grace window.');
        return;
      }

      // 4. Fetch existing scheduled post calendar IDs to prevent double-processing
      const existingScheduled = await this.db
        .select({ calendarPostId: schema.scheduledPosts.calendarPostId })
        .from(schema.scheduledPosts);
      const scheduledCalendarPostIds = new Set(existingScheduled.map(s => s.calendarPostId));

      const postsToApprove = pendingPosts.filter(p => !scheduledCalendarPostIds.has(p.id));

      if (postsToApprove.length === 0) {
        this.logger.debug('[AutoApprove] All candidate posts already have scheduled post records.');
        return;
      }

      this.logger.log(
        `[AutoApprove] Found ${postsToApprove.length} candidate post(s) within the ${windowHours}h grace window. Processing auto-approval...`
      );

      let approvedCount = 0;
      let skippedCount = 0;

      for (const post of postsToApprove) {
        try {
          // Find earliest pending suggestion variation for this post
          const suggestions = await this.db.query.contentSuggestions.findMany({
            where: and(
              eq(schema.contentSuggestions.postId, post.id),
              eq(schema.contentSuggestions.approvalStatus, 'PENDING_APPROVAL'),
            ),
            orderBy: asc(schema.contentSuggestions.createdAt),
          });

          if (suggestions.length === 0) {
            this.logger.warn(
              `[AutoApprove] Skipping post ID=${post.id} ("${post.title}"): no pending AI suggestions found.`
            );
            skippedCount++;
            continue;
          }

          const targetSuggestion = suggestions[0];

          // Re-use approval flow tagged with approvalSource = 'SYSTEM'
          await this.contentSuggestionsService.approveVariation(
            targetSuggestion.id,
            { scheduledFor: post.scheduledAt?.toISOString() },
            'SYSTEM',
          );

          approvedCount++;
          this.logger.log(
            `[AutoApprove] Successfully auto-approved post ID=${post.id} using suggestion ID=${targetSuggestion.id}`
          );
        } catch (postErr: any) {
          this.logger.error(
            `[AutoApprove] Failed to auto-approve post ID=${post.id}: ${postErr.message}`,
            postErr.stack,
          );
        }
      }

      this.logger.log(
        `[AutoApprove] Finished job run. Approved: ${approvedCount}, Skipped (no suggestions): ${skippedCount}.`
      );
    } catch (err: any) {
      this.logger.error('[AutoApprove] Unhandled error during auto-approve job execution', err.stack);
    }
  }
}
