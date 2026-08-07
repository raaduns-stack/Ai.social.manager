import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { AutoCloseTicketsJob } from './jobs/auto-close-tickets.job';

@Module({
  imports: [DatabaseModule],
  controllers: [SupportController],
  providers: [SupportService, AutoCloseTicketsJob],
  exports: [SupportService],
})
export class SupportModule {}
