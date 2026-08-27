import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationsService } from './notifications.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    DatabaseModule,
    MailerModule,
    ActivityLogsModule, // Required by PermissionsGuard
  ],
  providers: [NotificationsService],
  controllers: [
    AdminNotificationsController,
    CustomerNotificationsController,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
