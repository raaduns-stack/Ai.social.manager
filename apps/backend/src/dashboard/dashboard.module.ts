import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [SubscriptionsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
