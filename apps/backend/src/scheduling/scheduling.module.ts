import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { DispatchDuePostsJob } from './jobs/dispatch-due-posts.job';
import { AutoApprovePostsJob } from './jobs/auto-approve-posts.job';
import { ContentSuggestionsModule } from '../content-suggestions/content-suggestions.module';

@Module({
  imports: [ContentSuggestionsModule],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    DispatchDuePostsJob,
    AutoApprovePostsJob,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule {}
