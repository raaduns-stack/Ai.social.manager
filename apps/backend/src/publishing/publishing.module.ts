import { Module } from '@nestjs/common';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { ChannelsModule } from '../channels/channels.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [ChannelsModule, SocialAccountsModule],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
