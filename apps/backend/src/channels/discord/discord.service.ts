import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Response } from 'express';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  encryptSecret,
  decryptSecret,
} from '../../common/utils/encryption.util';
import { KycService } from '../../kyc/kyc.service';
import { SelectDiscordTargetDto } from './dto/select-discord-target.dto';

type Database = PostgresJsDatabase<typeof schema>;

/** Payload encoded inside the state JWT to correlate the callback with a user. */
interface StatePayload {
  /** The authenticated RaaSocial user ID. */
  sub: string;
  /** Random nonce to prevent replay attacks. */
  nonce: string;
}

/** Shape of Discord OAuth2 token response. */
interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  guild?: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
  };
}

/** Shape of Discord user profile response. */
interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
}

export interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions?: string;
  botInstalled?: boolean;
}

export interface DiscordChannelInfo {
  id: string;
  name: string;
  type: number;
  position?: number;
  parent_id?: string | null;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  /** Duration for the state JWT used to correlate the OAuth callback (10 minutes). */
  private readonly STATE_JWT_TTL = '10m';

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly kycService: KycService,
  ) {}

  // ---------------------------------------------------------------------------
  // State JWT helpers — used to pass authenticated userId through Discord's
  // OAuth redirect without server-side session storage.
  // ---------------------------------------------------------------------------

  /**
   * Generates a short-lived signed JWT to use as the OAuth `state` parameter.
   *
   * @param userId The authenticated RaaSocial user ID to embed in the state.
   * @returns A signed JWT string to use as `state` in the Discord auth URL.
   */
  async generateStateJwt(userId: string): Promise<string> {
    const payload: StatePayload = {
      sub: userId,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('auth.accessSecret'),
      expiresIn: this.STATE_JWT_TTL,
    });
  }

  /**
   * Verifies the state JWT and extracts the userId.
   * Throws UnauthorizedException if the token is invalid or expired.
   */
  private async verifyStateJwt(state: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<StatePayload>(state, {
        secret: this.configService.get<string>('auth.accessSecret'),
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired state parameter. Please start the Discord connection flow again.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // OAuth callback — called by Discord after user authorizes the app
  // ---------------------------------------------------------------------------

  /**
   * Handles the OAuth callback from Discord.
   *
   * @param code             Discord authorization code.
   * @param state            Signed JWT containing the authenticated RaaSocial userId.
   * @param res              Express response — used to perform the browser redirect.
   * @param callbackGuildId  Optional guild ID passed back by Discord if bot was added.
   */
  async handleCallback(
    code: string,
    state: string,
    res: Response,
    callbackGuildId?: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('frontendUrl') ||
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN ||
      'https://raasocial.io';
    const successUrl = `${frontendUrl}/dashboard/channels?discord=connected`;
    const errorBase = `${frontendUrl}/dashboard/channels?discord=error`;

    this.logger.log('Processing Discord OAuth callback...');

    // 1. Validate state JWT
    let userId: string;
    try {
      userId = await this.verifyStateJwt(state);
    } catch (err) {
      this.logger.warn(`Discord callback: invalid state JWT — ${err.message}`);
      res.redirect(`${errorBase}&reason=invalid_state`);
      return;
    }

    // 2. KYC gate
    try {
      const kycStatus = await this.kycService.getKycStatus(userId);
      if (kycStatus !== 'approved') {
        this.logger.warn(
          `Discord callback: user ${userId} blocked by KYC gate (status=${kycStatus})`,
        );
        res.redirect(`${errorBase}&reason=kyc_required`);
        return;
      }
    } catch (err) {
      this.logger.error(`Discord callback: KYC check failed — ${err.message}`);
      res.redirect(`${errorBase}&reason=kyc_check_failed`);
      return;
    }

    // 3. Exchange code for tokens
    let tokenData: DiscordTokenResponse;
    try {
      tokenData = await this.exchangeCodeForTokens(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Discord callback: token exchange failed — ${msg}`);
      res.redirect(`${errorBase}&reason=${encodeURIComponent(msg)}`);
      return;
    }

    // 4. Fetch user profile info
    let userInfo: DiscordUserResponse;
    try {
      userInfo = await this.fetchDiscordUserProfile(tokenData.access_token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Discord callback: user info fetch failed — ${msg}`);
      res.redirect(`${errorBase}&reason=${encodeURIComponent(msg)}`);
      return;
    }

    const handle =
      userInfo.global_name ||
      (userInfo.username ? `@${userInfo.username}` : userInfo.id);

    const guildId = callbackGuildId || tokenData.guild?.id || null;
    const guildName = tokenData.guild?.name || null;

    // 5. Upsert social_accounts row
    try {
      await this.upsertDiscordAccount({
        userId,
        discordUserId: userInfo.id,
        handle,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        guildId: guildId ?? undefined,
        guildName: guildName ?? undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Discord callback: DB upsert failed — ${msg}`,
        err instanceof Error ? err.stack : undefined,
      );
      res.redirect(`${errorBase}&reason=db_error`);
      return;
    }

    this.logger.log(
      `Discord account connected for user ${userId} (discordUserId=${userInfo.id}, handle=${handle}, guildId=${guildId})`,
    );
    res.redirect(successUrl);
  }

  // ---------------------------------------------------------------------------
  // Account status & Management API
  // ---------------------------------------------------------------------------

  /** Retrieves the connection status and details of a user's Discord account. */
  async getDiscordStatus(userId: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'discord'),
      ),
    });

    if (!account) {
      return { connected: false, platform: 'discord' };
    }

    const metadata = (account.metadata as Record<string, any>) || {};

    return {
      connected: account.status === 'connected',
      id: account.id,
      platform: account.platform,
      handle: account.accountHandle,
      status: account.status,
      connectedAt: account.connectedAt,
      tokenExpiresAt: account.tokenExpiresAt,
      guildId: metadata.guildId || null,
      guildName: metadata.guildName || null,
      channelId: metadata.channelId || null,
      channelName: metadata.channelName || null,
    };
  }

  /** Disconnects/deletes a user's Discord account connection. */
  async disconnectDiscord(userId: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'discord'),
      ),
    });

    if (!account) {
      throw new NotFoundException('No connected Discord account found.');
    }

    await this.db
      .delete(schema.social_accounts)
      .where(eq(schema.social_accounts.id, account.id));

    return { success: true, message: 'Discord connection removed successfully.' };
  }

  /** Gets servers/guilds user has access to, incorporating bot membership if available. */
  async getUserGuilds(userId: string): Promise<DiscordGuildInfo[]> {
    const userAccessToken = await this.getDecryptedAccessToken(userId);

    // Fetch guilds from user OAuth token
    const userGuildsRes = await fetch(
      'https://discord.com/api/v10/users/@me/guilds',
      {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      },
    );

    if (!userGuildsRes.ok) {
      const errJson = await userGuildsRes.json().catch(() => ({}));
      this.logger.warn(
        `Failed to fetch user guilds: ${userGuildsRes.status} — ${JSON.stringify(errJson)}`,
      );
      throw new BadRequestException(
        `Discord API error fetching user servers (${userGuildsRes.status})`,
      );
    }

    const userGuilds: DiscordGuildInfo[] = await userGuildsRes.json();

    // Filter guilds where user is owner or has MANAGE_GUILD (0x20) / ADMIN (0x8) permission
    const eligibleGuilds = userGuilds.filter((g) => {
      if (g.owner) return true;
      if (!g.permissions) return false;
      const perms = BigInt(g.permissions);
      const adminBit = BigInt(0x8);
      const manageGuildBit = BigInt(0x20);
      return (perms & adminBit) === adminBit || (perms & manageGuildBit) === manageGuildBit;
    });

    return eligibleGuilds;
  }

  /** Gets text channels for a specified guild. */
  async getGuildChannels(
    userId: string,
    guildId: string,
  ): Promise<DiscordChannelInfo[]> {
    const botToken = this.configService.get<string>('discord.botToken');
    let authorizationHeader = '';

    if (botToken) {
      authorizationHeader = `Bot ${botToken}`;
    } else {
      const userAccessToken = await this.getDecryptedAccessToken(userId);
      authorizationHeader = `Bearer ${userAccessToken}`;
    }

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: { Authorization: authorizationHeader },
      },
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      this.logger.warn(
        `Failed to fetch channels for guild ${guildId}: ${res.status} — ${JSON.stringify(errJson)}`,
      );
      throw new BadRequestException(
        `Discord API error fetching channels (${res.status}): ${errJson.message || 'Unauthorized or Bot not in server'}`,
      );
    }

    const channels: DiscordChannelInfo[] = await res.json();
    // Return only text channels (type 0) or announcement channels (type 5)
    return channels.filter((c) => c.type === 0 || c.type === 5);
  }

  /** Saves selected guild and channel target in account metadata. */
  async selectTarget(userId: string, dto: SelectDiscordTargetDto) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'discord'),
      ),
    });

    if (!account) {
      throw new NotFoundException('No connected Discord account found for this user.');
    }

    const existingMetadata = (account.metadata as Record<string, any>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      guildId: dto.guildId,
      channelId: dto.channelId || existingMetadata.channelId || null,
      guildName: dto.guildName || existingMetadata.guildName || null,
      channelName: dto.channelName || existingMetadata.channelName || null,
    };

    await this.db
      .update(schema.social_accounts)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.social_accounts.id, account.id));

    return {
      success: true,
      message: 'Target Discord server/channel updated successfully.',
      metadata: updatedMetadata,
    };
  }

  /** Posts a message to a Discord channel. */
  async sendMessage(userId: string, channelId: string, content: string) {
    let targetChannelId = channelId;

    // Fallback to saved channel ID if not directly provided
    if (!targetChannelId) {
      const status = await this.getDiscordStatus(userId);
      if (status.channelId) {
        targetChannelId = status.channelId;
      }
    }

    if (!targetChannelId) {
      throw new BadRequestException(
        'No target Discord channel specified or configured for this user.',
      );
    }

    const botToken = this.configService.get<string>('discord.botToken');
    let authorizationHeader = '';

    if (botToken) {
      authorizationHeader = `Bot ${botToken}`;
    } else {
      const userAccessToken = await this.getDecryptedAccessToken(userId);
      authorizationHeader = `Bearer ${userAccessToken}`;
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${targetChannelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: authorizationHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      },
    );

    const json = await response.json();

    if (!response.ok) {
      throw new BadRequestException(
        `Discord API error (${response.status}): ${json.message || JSON.stringify(json)}`,
      );
    }

    return {
      success: true,
      messageId: json.id,
      channelId: json.channel_id,
      content: json.content,
      timestamp: json.timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /** Exchanges a Discord authorization code for access and refresh tokens. */
  private async exchangeCodeForTokens(
    code: string,
  ): Promise<DiscordTokenResponse> {
    const rawClientId =
      this.configService.get<string>('discord.clientId') ||
      process.env.DISCORD_CLIENT_ID ||
      '';
    const rawClientSecret =
      this.configService.get<string>('discord.clientSecret') ||
      process.env.DISCORD_CLIENT_SECRET ||
      '';
    const rawRedirectUri =
      this.configService.get<string>('discord.redirectUri') ||
      process.env.DISCORD_REDIRECT_URI ||
      '';

    // Sanitize credentials — strip surrounding quotes, carriage returns, or whitespace
    const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');
    const clientSecret = rawClientSecret.trim().replace(/^["']|["']$/g, '').replace(/\r|\n/g, '');
    const redirectUri = rawRedirectUri.trim().replace(/^["']|["']$/g, '');

    const tokenEndpoint = 'https://discord.com/api/v10/oauth2/token';

    // Safe diagnostic logging (NEVER exposing secrets or codes)
    this.logger.log(
      `Discord token config: clientId=${clientId}, secretConfigured=${!!clientSecret}, secretLength=${clientSecret.length}, redirectUri=${redirectUri}, codeProvided=${!!code}, endpoint=${tokenEndpoint}`,
    );

    if (clientSecret.length !== 32) {
      this.logger.warn(
        `Discord client secret length warning: DISCORD_CLIENT_SECRET is ${clientSecret.length} characters long. Standard Discord OAuth2 Client Secrets are 32 characters long. If a Bot Token (~72 chars) was configured instead of the Client Secret, Discord will reject the token exchange with 401 invalid_client.`,
      );
    }

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error(
        `Discord credentials missing check — Client ID present: ${!!clientId}, Secret present: ${!!clientSecret}, Redirect URI: ${redirectUri}`,
      );
      throw new InternalServerErrorException(
        'Discord OAuth credentials are not configured on this server.',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: params.toString(),
    });

    const json: any = await response.json();

    if (!response.ok || !json.access_token) {
      const errorMsg =
        json.error_description || json.error || json.message || JSON.stringify(json);
      this.logger.error(
        `Discord token exchange HTTP ${response.status}: ${errorMsg}`,
      );
      throw new BadRequestException(
        `Discord token endpoint error (${response.status}): ${errorMsg}`,
      );
    }

    return json as DiscordTokenResponse;
  }

  /** Fetches Discord user profile using user access token. */
  private async fetchDiscordUserProfile(
    accessToken: string,
  ): Promise<DiscordUserResponse> {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const json = await response.json();

    if (!response.ok || !json.id) {
      throw new BadRequestException(
        `Discord user info error (${response.status}): ${json.message || JSON.stringify(json)}`,
      );
    }

    return json as DiscordUserResponse;
  }

  /** Inserts or updates the `social_accounts` row for a Discord connection. */
  private async upsertDiscordAccount(params: {
    userId: string;
    discordUserId: string;
    handle: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    guildId?: string;
    guildName?: string;
  }): Promise<void> {
    const encryptedAccess = encryptSecret(params.accessToken);
    const encryptedRefresh = params.refreshToken
      ? encryptSecret(params.refreshToken)
      : null;
    const tokenExpiresAt = params.expiresIn
      ? new Date(Date.now() + params.expiresIn * 1000)
      : null;
    const now = new Date();

    const existing = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, params.userId),
        eq(schema.social_accounts.platform, 'discord'),
      ),
    });

    const existingMetadata = (existing?.metadata as Record<string, any>) || {};
    const metadata = {
      ...existingMetadata,
      discordUserId: params.discordUserId,
      guildId: params.guildId || existingMetadata.guildId || null,
      guildName: params.guildName || existingMetadata.guildName || null,
    };

    if (existing) {
      await this.db
        .update(schema.social_accounts)
        .set({
          accountHandle: params.handle,
          status: 'connected',
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt,
          metadata,
          connectedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.social_accounts.id, existing.id));
    } else {
      await this.db.insert(schema.social_accounts).values({
        userId: params.userId,
        platform: 'discord',
        accountHandle: params.handle,
        status: 'connected',
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt,
        metadata,
        connectedAt: now,
      });
    }
  }

  /** Retrieves and decrypts stored Discord access token for a user. */
  async getDecryptedAccessToken(userId: string): Promise<string> {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'discord'),
      ),
    });

    if (!account?.accessToken) {
      throw new BadRequestException(
        'No connected Discord account found for this user.',
      );
    }

    return decryptSecret(account.accessToken);
  }
}
