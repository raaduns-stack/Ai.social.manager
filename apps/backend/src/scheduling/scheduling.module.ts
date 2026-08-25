import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { DispatchDuePostsJob } from './jobs/dispatch-due-posts.job';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, DispatchDuePostsJob],
  exports: [SchedulingService],
})
export class SchedulingModule {}
