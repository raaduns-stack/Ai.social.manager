import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [SubscriptionsModule, SocialAccountsModule],
  controllers: [DashboardController],
})
export class DashboardModule { }