import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { DispatchDuePostsJob } from './jobs/dispatch-due-posts.job';
import { AutoApprovePostsJob } from './jobs/auto-approve-posts.job';
import { DispatchScheduledNotificationsJob } from './jobs/dispatch-scheduled-notifications.job';
import { SubscriptionRemindersJob } from './jobs/subscription-reminders.job';
import { ContentSuggestionsModule } from '../content-suggestions/content-suggestions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ContentSuggestionsModule, NotificationsModule],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    DispatchDuePostsJob,
    AutoApprovePostsJob,
    DispatchScheduledNotificationsJob,
    SubscriptionRemindersJob,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule { }
