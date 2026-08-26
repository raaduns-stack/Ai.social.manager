import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DiscordService } from './discord.service';
import { DiscordCallbackQueryDto } from './dto/discord-callback.query.dto';
import { SendDiscordMessageDto } from './dto/send-discord-message.dto';
import { SelectDiscordTargetDto } from './dto/select-discord-target.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('channels')
@Controller('channels/discord')
export class DiscordController {
  private readonly logger = new Logger(DiscordController.name);

  constructor(
    private readonly discordService: DiscordService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /api/channels/discord/connect
  //
  // Called by the frontend when the user clicks "Connect Discord".
  // Returns the Discord authorization URL (with a signed state JWT embedded)
  // so the frontend can redirect the user's browser to Discord.
  // ---------------------------------------------------------------------------
  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Begin Discord OAuth flow — returns the Discord authorization URL',
    description:
      'The frontend should redirect the user to the returned `authUrl`. ' +
      'The `state` parameter embedded in the URL is a short-lived signed JWT ' +
      'containing the authenticated userId, so the callback can associate the ' +
      'Discord account with the correct RaaSocial user without server-side sessions.',
  })
  async connect(@CurrentUser() user: { userId: string }) {
    const stateJwt = await this.discordService.generateStateJwt(user.userId);

    const clientId =
      this.configService.get<string>('discord.clientId') ||
      process.env.DISCORD_CLIENT_ID ||
      '';
    const redirectUri =
      this.configService.get<string>('discord.redirectUri') ||
      process.env.DISCORD_REDIRECT_URI ||
      '';

    // Request identify (user profile), guilds, bot, and applications.commands scopes
    const scope = 'identify guilds bot applications.commands';
    // Permissions=2048 corresponds to "Send Messages"
    const permissions = '2048';

    this.logger.log(
      `Discord connect initiated for user ${user.userId}. Client ID configured: ${!!clientId}, Redirect URI: ${redirectUri}`,
    );

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope,
      permissions,
      state: stateJwt,
    });

    const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

    return { authUrl };
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/discord/callback
  //
  // Discord redirects the user's browser here after authorization.
  // Production URL: https://raasocial.io/api/channels/discord/callback
  // ---------------------------------------------------------------------------
  @Get('callback')
  @ApiOperation({
    summary: 'Discord OAuth2 callback — DO NOT call directly',
    description:
      'This endpoint is the redirect URI registered in the Discord Developer Portal. ' +
      'Discord sends the browser here after the user authorizes the app. ' +
      'It validates the state JWT, exchanges code for tokens, stores them ' +
      'encrypted, and redirects the browser back to the frontend.',
  })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'guild_id', required: false })
  @ApiQuery({ name: 'permissions', required: false })
  @ApiQuery({ name: 'error', required: false })
  @ApiQuery({ name: 'error_description', required: false })
  async callback(
    @Query() query: DiscordCallbackQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('frontendUrl') ||
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN ||
      'https://raasocial.io';
    const errorBase = `${frontendUrl}/dashboard/channels?discord=error`;

    if (query.error) {
      this.logger.warn(
        `Discord callback received error param: ${query.error} — ${query.error_description}`,
      );
      res.redirect(`${errorBase}&reason=${encodeURIComponent(query.error)}`);
      return;
    }

    if (!query.code || !query.state) {
      this.logger.warn('Discord callback: missing code or state parameter');
      res.redirect(`${errorBase}&reason=missing_params`);
      return;
    }

    await this.discordService.handleCallback(
      query.code,
      query.state,
      res,
      query.guild_id,
    );
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/discord/status
  // ---------------------------------------------------------------------------
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Discord channel status for authenticated user',
  })
  async getStatus(@CurrentUser() user: { userId: string }) {
    return this.discordService.getDiscordStatus(user.userId);
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/discord/guilds
  // Returns servers/guilds accessible to the user/bot
  // ---------------------------------------------------------------------------
  @Get('guilds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get list of Discord servers/guilds available for user',
  })
  async getGuilds(@CurrentUser() user: { userId: string }) {
    return this.discordService.getUserGuilds(user.userId);
  }

  // ---------------------------------------------------------------------------
  // GET /api/channels/discord/guilds/:guildId/channels
  // Returns channels within a specific guild/server
  // ---------------------------------------------------------------------------
  @Get('guilds/:guildId/channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get list of text channels for a Discord guild',
  })
  async getGuildChannels(
    @CurrentUser() user: { userId: string },
    @Param('guildId') guildId: string,
  ) {
    return this.discordService.getGuildChannels(user.userId, guildId);
  }

  // ---------------------------------------------------------------------------
  // POST /api/channels/discord/select-target
  // Saves the selected Discord guild and channel for posting
  // ---------------------------------------------------------------------------
  @Post('select-target')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Select target Discord guild and channel for posting',
  })
  async selectTarget(
    @CurrentUser() user: { userId: string },
    @Body() dto: SelectDiscordTargetDto,
  ) {
    return this.discordService.selectTarget(user.userId, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/channels/discord
  // ---------------------------------------------------------------------------
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disconnect Discord account for authenticated user',
  })
  async disconnect(@CurrentUser() user: { userId: string }) {
    return this.discordService.disconnectDiscord(user.userId);
  }

  // ---------------------------------------------------------------------------
  // POST /api/channels/discord/send-message
  // ---------------------------------------------------------------------------
  @Post('send-message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send a message to a Discord channel',
  })
  async sendMessage(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendDiscordMessageDto,
  ) {
    return this.discordService.sendMessage(
      user.userId,
      dto.channelId,
      dto.content,
    );
  }
}
