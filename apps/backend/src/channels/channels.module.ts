import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TikTokController } from './tiktok/tiktok.controller';
import { TikTokService } from './tiktok/tiktok.service';
import { DiscordController } from './discord/discord.controller';
import { DiscordService } from './discord/discord.service';
import { TumblrController } from './tumblr/tumblr.controller';
import { TumblrService } from './tumblr/tumblr.service';
import { KycModule } from '../kyc/kyc.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

/**
 * ChannelsModule — handles OAuth flows and webhook receivers for all
 * social media platforms integrated via Login Kit / OAuth.
 *
 * Currently supports: TikTok, Discord, Tumblr
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
 *   GET    /api/channels/tumblr/connect     — initiate Tumblr OAuth flow
 *   GET    /api/channels/tumblr/callback    — Tumblr OAuth callback
 *   GET    /api/channels/tumblr/status     — Tumblr connection status
 *   DELETE /api/channels/tumblr            — Disconnect Tumblr
 *   GET    /api/channels/tumblr/blogs       — Fetch user Tumblr blogs
 *   POST   /api/channels/tumblr/select-blog — Select target Tumblr blog
 *   POST   /api/channels/tumblr/send-post   — Send post to Tumblr blog
 */
@Module({
  imports: [
    JwtModule.register({}),
    KycModule,
    SocialAccountsModule,
  ],
  controllers: [TikTokController, DiscordController, TumblrController],
  providers: [TikTokService, DiscordService, TumblrService],
  exports: [TikTokService, DiscordService, TumblrService],
})
export class ChannelsModule {}


