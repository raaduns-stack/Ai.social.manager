import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { DispatchDuePostsJob } from './jobs/dispatch-due-posts.job';
import { DispatchScheduledNotificationsJob } from './jobs/dispatch-scheduled-notifications.job';
import { SubscriptionRemindersJob } from './jobs/subscription-reminders.job';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, DispatchDuePostsJob, DispatchScheduledNotificationsJob, SubscriptionRemindersJob],
  imports: [NotificationsModule],
  exports: [SchedulingService],
})
export class SchedulingModule {}
