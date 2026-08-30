import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TikTokController } from './tiktok/tiktok.controller';
import { TikTokService } from './tiktok/tiktok.service';
import { DiscordController } from './discord/discord.controller';
import { DiscordService } from './discord/discord.service';
import { KycModule } from '../kyc/kyc.module';

/**
 * ChannelsModule — handles OAuth flows and webhook receivers for all
 * social media platforms integrated via Login Kit / OAuth.
 *
 * Currently supports: TikTok, Discord
 * Future: Facebook, Instagram, LinkedIn, YouTube, X
 *
 * Routes (all prefixed with /api by global prefix):
 *   GET    /api/channels/tiktok/connect     — initiate TikTok OAuth flow
 *   GET    /api/channels/tiktok/callback    — TikTok redirect URI
 *   POST   /api/channels/tiktok/webhook     — TikTok webhook events
 *   GET    /api/channels/discord/connect    — initiate Discord OAuth flow
 *   GET    /api/channels/discord/callback   — Discord redirect URI
 *   GET    /api/channels/discord/status     — Discord connection status
 *   DELETE /api/channels/discord            — Disconnect Discord
 *   POST   /api/channels/discord/send-message — Send message to Discord channel
 */
@Module({
  imports: [
    JwtModule.register({}),
    KycModule,
  ],
  controllers: [TikTokController, DiscordController],
  providers: [TikTokService, DiscordService],
  exports: [TikTokService, DiscordService],
})
export class ChannelsModule {}

