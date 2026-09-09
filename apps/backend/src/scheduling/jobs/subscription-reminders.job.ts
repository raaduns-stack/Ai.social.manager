import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../common/enums';

@Injectable()
export class SubscriptionRemindersJob {
  private readonly logger = new Logger(SubscriptionRemindersJob.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 0 * * *') // Run daily at midnight
  async handleCron() {
    this.logger.debug('Running subscription-reminders job...');

    try {
      const daysBeforeExpiry = 7;
      const reminderWindow = new Date();
      reminderWindow.setDate(reminderWindow.getDate() + daysBeforeExpiry);

      const expiringSubscriptions = await this.subscriptionsService.findExpiringWithin(reminderWindow);

      if (expiringSubscriptions.length === 0) {
        this.logger.debug('No subscriptions expiring within the reminder window.');
        return;
      }

      this.logger.log(`Found ${expiringSubscriptions.length} subscription(s) expiring within ${daysBeforeExpiry} days.`);

      for (const subscription of expiringSubscriptions) {
        try {
          if (!subscription.currentPeriodEnd) {
            this.logger.warn(`Subscription ${subscription.id} has no currentPeriodEnd, skipping reminder.`);
            continue;
          }

          const expiryDate = new Date(subscription.currentPeriodEnd);
          const daysToExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          const existing = await this.notificationsService.findExistingNotification(
            subscription.userId,
            NotificationType.SUBSCRIPTION_RENEWAL_REMINDER,
            'subscription',
            subscription.id,
          );

          if (existing) {
            this.logger.debug(`Reminder already sent for subscription ${subscription.id}`);
            continue;
          }

          await this.notificationsService.triggerSubscriptionRenewalReminder({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            daysToExpiry,
            expiryDate,
          });

          this.logger.log(`Sent renewal reminder for subscription ${subscription.id} (${daysToExpiry} days remaining).`);
        } catch (error) {
          this.logger.error(`Failed to process reminder for subscription ${subscription.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process subscription reminders', error);
    }
  }
}
