import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FaqsController } from './faqs.controller';
import { FaqsAdminController } from './faqs-admin.controller';
import { FaqsService } from './faqs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FaqsController, FaqsAdminController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
