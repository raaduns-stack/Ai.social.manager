import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { AutoCloseTicketsJob } from './jobs/auto-close-tickets.job';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService, AutoCloseTicketsJob],
  exports: [SupportService],
})
export class SupportModule {}
