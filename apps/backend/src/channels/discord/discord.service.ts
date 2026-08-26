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
    icon: string;
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
   * Flow:
   *  1. Validate state JWT -> extract userId
   *  2. Check KYC approval gate
   *  3. Exchange authorization code for access/refresh tokens
   *  4. Fetch Discord user info (username / global_name / avatar)
   *  5. Upsert the social_accounts row for this user + discord platform
   *  6. Redirect browser to frontend success/error URL
   *
   * @param code   Discord authorization code.
   * @param state  Signed JWT containing the authenticated RaaSocial userId.
   * @param res    Express response — used to perform the browser redirect.
   */
  async handleCallback(
    code: string,
    state: string,
    res: Response,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('frontendUrl') || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/dashboard/channels?discord=connected`;
    const errorBase = `${frontendUrl}/dashboard/channels?discord=error`;

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
      this.logger.error(
        `Discord callback: token exchange failed — ${err.message}`,
      );
      res.redirect(`${errorBase}&reason=token_exchange_failed`);
      return;
    }

    // 4. Fetch user profile info
    let userInfo: DiscordUserResponse;
    try {
      userInfo = await this.fetchDiscordUserProfile(tokenData.access_token);
    } catch (err) {
      this.logger.error(
        `Discord callback: user info fetch failed — ${err.message}`,
      );
      res.redirect(`${errorBase}&reason=user_info_failed`);
      return;
    }

    const handle =
      userInfo.global_name ||
      (userInfo.username ? `@${userInfo.username}` : userInfo.id);

    // 5. Upsert social_accounts row
    try {
      await this.upsertDiscordAccount({
        userId,
        discordUserId: userInfo.id,
        handle,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });
    } catch (err) {
      this.logger.error(
        `Discord callback: DB upsert failed — ${err.message}`,
        err.stack,
      );
      res.redirect(`${errorBase}&reason=db_error`);
      return;
    }

    this.logger.log(
      `Discord account connected for user ${userId} (discordUserId=${userInfo.id}, handle=${handle})`,
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

    return {
      connected: account.status === 'connected',
      id: account.id,
      platform: account.platform,
      handle: account.accountHandle,
      status: account.status,
      connectedAt: account.connectedAt,
      tokenExpiresAt: account.tokenExpiresAt,
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

  /** Posts a message to a Discord channel. */
  async sendMessage(userId: string, channelId: string, content: string) {
    const botToken = this.configService.get<string>('discord.botToken');
    let authorizationHeader = '';

    if (botToken) {
      authorizationHeader = `Bot ${botToken}`;
    } else {
      // Fall back to user access token
      const userAccessToken = await this.getDecryptedAccessToken(userId);
      authorizationHeader = `Bearer ${userAccessToken}`;
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
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
    const clientId = this.configService.get<string>('discord.clientId');
    const clientSecret = this.configService.get<string>('discord.clientSecret');
    const redirectUri = this.configService.get<string>('discord.redirectUri');

    if (!clientId || !clientSecret || !redirectUri) {
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

    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const json: any = await response.json();

    if (!response.ok || !json.access_token) {
      throw new BadRequestException(
        `Discord token endpoint error: ${json.error_description || json.message || JSON.stringify(json)}`,
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
        `Discord user info error: ${json.message || JSON.stringify(json)}`,
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

    if (existing) {
      await this.db
        .update(schema.social_accounts)
        .set({
          accountHandle: params.handle,
          status: 'connected',
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt,
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
