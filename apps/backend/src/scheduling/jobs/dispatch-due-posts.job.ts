import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SchedulingService } from '../scheduling.service';

@Injectable()
export class DispatchDuePostsJob {
  private readonly logger = new Logger(DispatchDuePostsJob.name);

  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/2 * * * *') // Run every 2 minutes
  async handleCron() {
    this.logger.debug('Running dispatch-due-posts job...');

    const webhookUrl = this.configService.get<string>('n8n.publishingWebhookUrl');
    if (!webhookUrl) {
      this.logger.warn('N8N_PUBLISHING_WEBHOOK_URL is not configured. Skipping dispatch.');
      return;
    }

    try {
      const duePosts = await this.schedulingService.findDuePosts();
      if (duePosts.length === 0) {
        this.logger.debug('No due posts to dispatch.');
        return;
      }

      this.logger.log(`Found ${duePosts.length} due post(s) to dispatch. Sending to n8n webhook...`);

      for (const post of duePosts) {
        try {
          const payload = {
            scheduledPostId: post.scheduledPostId,
            platform: post.platform,
            content: post.content,
            mediaUrl: post.mediaUrl || null,
            socialAccountId: post.socialAccountId,
            calendarPostId: post.calendarPostId,
            variationId: post.variationId,
          };

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errText = await response.text();
            this.logger.error(
              `Failed to dispatch scheduled post ${post.scheduledPostId}. Webhook returned status ${response.status}: ${errText}`
            );
          } else {
            this.logger.log(`Successfully dispatched scheduled post ${post.scheduledPostId} to webhook.`);
          }
        } catch (error) {
          this.logger.error(
            `Failed to dispatch scheduled post ${post.scheduledPostId} due to connection error`,
            error
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to query or process due scheduled posts', error);
    }
  }
}
