import { Module, Global } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';

@Global()
@Module({
  // DatabaseModule is @Global(), so DATABASE_CONNECTION is available without importing here.
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
