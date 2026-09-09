import { Module } from '@nestjs/common';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [SocialAccountsModule, ChannelsModule],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}

