import { Module } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';

@Module({
  // DatabaseModule is @Global(), so DATABASE_CONNECTION is available without importing here.
  providers: [LoginHistoryService],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
