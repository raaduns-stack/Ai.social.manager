import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationsService } from './notifications.service';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    DatabaseModule,
    MailerModule,
    ActivityLogsModule,
  ],
  providers: [NotificationsService, ScheduledNotificationsService],
  controllers: [
    AdminNotificationsController,
    CustomerNotificationsController,
  ],
  exports: [NotificationsService, ScheduledNotificationsService],
})
export class NotificationsModule {}
