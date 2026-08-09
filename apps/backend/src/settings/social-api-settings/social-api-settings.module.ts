import { Module } from '@nestjs/common';
import { SocialApiSettingsController } from './social-api-settings.controller';
import { SocialApiSettingsService } from './social-api-settings.service';

@Module({
  controllers: [SocialApiSettingsController],
  providers: [SocialApiSettingsService],
  exports: [SocialApiSettingsService],
})
export class SocialApiSettingsModule {}
