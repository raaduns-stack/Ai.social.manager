import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScheduledNotificationsService } from '../../notifications/scheduled-notifications.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ScheduledNotificationStatus, NotificationChannel, NotificationType } from '../../common/enums';

@Injectable()
export class DispatchScheduledNotificationsJob {
  private readonly logger = new Logger(DispatchScheduledNotificationsJob.name);

  constructor(
    private readonly scheduledNotificationsService: ScheduledNotificationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('*/1 * * * *') // Run every minute
  async handleCron() {
    this.logger.debug('Running dispatch-scheduled-notifications job...');

    try {
      const dueNotifications = await this.scheduledNotificationsService.findDue(50);
      if (dueNotifications.length === 0) {
        this.logger.debug('No scheduled notifications to dispatch.');
        return;
      }

      this.logger.log(`Found ${dueNotifications.length} scheduled notification(s) to dispatch.`);

      for (const scheduled of dueNotifications) {
        try {
          await this.notificationsService.createNotification({
            userId: scheduled.userId,
            type: scheduled.type as NotificationType,
            channel: scheduled.channel as NotificationChannel,
            priority: scheduled.priority,
            title: scheduled.title,
            message: scheduled.message,
            scheduledFor: scheduled.scheduledFor,
            metadata: {
              ...scheduled.metadata,
              scheduledNotificationId: scheduled.id,
            },
          });

          await this.scheduledNotificationsService.markDispatched(scheduled.id);
          this.logger.log(`Successfully dispatched scheduled notification ${scheduled.id} for user ${scheduled.userId}.`);
        } catch (error) {
          this.logger.error(`Failed to dispatch scheduled notification ${scheduled.id}`, error);
          await this.scheduledNotificationsService.markFailed(scheduled.id);
        }
      }
    } catch (error) {
      this.logger.error('Failed to query or process scheduled notifications', error);
    }
  }
}
