import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
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

/** Shape of TikTok's token endpoint response. */
interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/** Shape of TikTok's user info endpoint response. */
interface TikTokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      display_name: string;
      username?: string;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);

  /** Duration for the state JWT used to correlate the OAuth callback (10 minutes). */
  private readonly STATE_JWT_TTL = '10m';

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly kycService: KycService,
  ) {}

  // ---------------------------------------------------------------------------
  // State JWT helpers — used to pass authenticated userId through TikTok's
  // OAuth redirect without server-side session storage.
  // ---------------------------------------------------------------------------

  /**
   * Generates a short-lived signed JWT to use as the OAuth `state` parameter.
   *
   * The frontend calls GET /api/channels/tiktok/connect to obtain this token,
   * then appends it to the TikTok authorization URL before redirecting the user.
   *
   * @param userId The authenticated RaaSocial user ID to embed in the state.
   * @returns A signed JWT string to use as `state` in the TikTok auth URL.
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
        'Invalid or expired state parameter. Please start the TikTok connection flow again.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // OAuth callback — called by TikTok after user authorises the app
  // ---------------------------------------------------------------------------

  /**
   * Handles the OAuth callback from TikTok.
   *
   * Flow:
   *  1. Validate state JWT → extract userId
   *  2. Check KYC approval gate
   *  3. Exchange authorization code for access/refresh tokens
   *  4. Fetch TikTok user info (display name / username)
   *  5. Upsert the social_accounts row for this user + tiktok platform
   *  6. Redirect browser to frontend success/error URL
   *
   * @param code   TikTok authorization code.
   * @param state  Signed JWT containing the authenticated RaaSocial userId.
   * @param res    Express response — used to perform the browser redirect.
   */
  async handleCallback(
    code: string,
    state: string,
    res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const successUrl = `${frontendUrl}/settings?tab=channels&tiktok=connected`;
    const errorBase = `${frontendUrl}/settings?tab=channels&tiktok=error`;

    // 1. Validate state JWT
    let userId: string;
    try {
      userId = await this.verifyStateJwt(state);
    } catch (err) {
      this.logger.warn(`TikTok callback: invalid state JWT — ${err.message}`);
      res.redirect(`${errorBase}&reason=invalid_state`);
      return;
    }

    // 2. KYC gate
    try {
      const kycStatus = await this.kycService.getKycStatus(userId);
      if (kycStatus !== 'approved') {
        this.logger.warn(
          `TikTok callback: user ${userId} blocked by KYC gate (status=${kycStatus})`,
        );
        res.redirect(`${errorBase}&reason=kyc_required`);
        return;
      }
    } catch (err) {
      this.logger.error(`TikTok callback: KYC check failed — ${err.message}`);
      res.redirect(`${errorBase}&reason=kyc_check_failed`);
      return;
    }

    // 3. Exchange code for tokens
    let tokenData: TikTokTokenResponse;
    try {
      tokenData = await this.exchangeCodeForTokens(code);
    } catch (err) {
      this.logger.error(
        `TikTok callback: token exchange failed — ${err.message}`,
      );
      res.redirect(`${errorBase}&reason=token_exchange_failed`);
      return;
    }

    // 4. Fetch user info
    let displayName: string;
    try {
      displayName = await this.fetchTikTokDisplayName(
        tokenData.access_token,
        tokenData.open_id,
      );
    } catch (err) {
      this.logger.warn(
        `TikTok callback: user info fetch failed, using openId as handle — ${err.message}`,
      );
      displayName = tokenData.open_id;
    }

    // 5. Upsert social_accounts row
    try {
      await this.upsertTikTokAccount({
        userId,
        openId: tokenData.open_id,
        displayName,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });
    } catch (err) {
      this.logger.error(
        `TikTok callback: DB upsert failed — ${err.message}`,
        err.stack,
      );
      res.redirect(`${errorBase}&reason=db_error`);
      return;
    }

    this.logger.log(
      `TikTok account connected for user ${userId} (openId=${tokenData.open_id})`,
    );
    res.redirect(successUrl);
  }

  // ---------------------------------------------------------------------------
  // Webhook — receives event notifications from TikTok
  // ---------------------------------------------------------------------------

  /**
   * Validates and processes an incoming TikTok webhook event.
   *
   * TikTok signs webhooks using HMAC-SHA256:
   *   signature = HMAC-SHA256(clientSecret, timestamp + nonce + body)
   *
   * Reference: https://developers.tiktok.com/doc/webhooks-verification
   *
   * @param headers Raw request headers (used for signature, timestamp, nonce).
   * @param rawBody Raw request body bytes (must be the exact bytes TikTok sent).
   * @param parsedBody Parsed JSON body (for event routing).
   */
  handleWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
    parsedBody: any,
  ): { message: string } {
    this.validateWebhookSignature(headers, rawBody);

    const eventType: string = parsedBody?.event ?? 'unknown';
    this.logger.log(`TikTok webhook received: event=${eventType}`);

    // Route events here as the integration grows.
    switch (eventType) {
      // Example: video.publish_complete, user.data_deletion, etc.
      default:
        this.logger.debug(
          `TikTok webhook: unhandled event type "${eventType}" — body=${JSON.stringify(parsedBody)}`,
        );
    }

    // TikTok expects a 200 OK with any response body.
    return { message: 'ok' };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Exchanges a TikTok authorization code for access and refresh tokens.
   *
   * Reference: https://developers.tiktok.com/doc/oauth-user-access-token-management
   */
  private async exchangeCodeForTokens(
    code: string,
  ): Promise<TikTokTokenResponse> {
    const clientKey = this.configService.get<string>('tiktok.clientKey');
    const clientSecret = this.configService.get<string>('tiktok.clientSecret');
    const redirectUri = this.configService.get<string>('tiktok.redirectUri');

    if (!clientKey || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'TikTok OAuth credentials are not configured on this server.',
      );
    }

    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch(
      'https://open.tiktokapis.com/v2/oauth/token/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      },
    );

    const json: any = await response.json();

    if (!response.ok || !json.access_token) {
      throw new BadRequestException(
        `TikTok token endpoint error: ${json.error_description ?? json.message ?? JSON.stringify(json)}`,
      );
    }

    return json as TikTokTokenResponse;
  }

  /**
   * Fetches the TikTok user's display name using their access token.
   *
   * Reference: https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info
   */
  private async fetchTikTokDisplayName(
    accessToken: string,
    openId: string,
  ): Promise<string> {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const json: TikTokUserInfoResponse = await response.json();

    if (json.error?.code !== 'ok' && json.error?.code) {
      throw new BadRequestException(
        `TikTok user info error: ${json.error.message}`,
      );
    }

    return (
      json.data?.user?.username ||
      json.data?.user?.display_name ||
      openId
    );
  }

  /**
   * Inserts or updates the `social_accounts` row for a TikTok connection.
   *
   * If the user already has a TikTok row (e.g. re-connecting), the existing
   * row is updated with fresh tokens. Otherwise a new row is inserted.
   * Access and refresh tokens are stored encrypted at rest.
   */
  private async upsertTikTokAccount(params: {
    userId: string;
    openId: string;
    displayName: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): Promise<void> {
    const encryptedAccess = encryptSecret(params.accessToken);
    const encryptedRefresh = encryptSecret(params.refreshToken);
    const tokenExpiresAt = new Date(Date.now() + params.expiresIn * 1000);
    const now = new Date();

    // Check for an existing TikTok row for this user
    const existing = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, params.userId),
        eq(schema.social_accounts.platform, 'tiktok'),
      ),
    });

    if (existing) {
      await this.db
        .update(schema.social_accounts)
        .set({
          accountHandle: params.displayName,
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
        platform: 'tiktok',
        accountHandle: params.displayName,
        status: 'connected',
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt,
        connectedAt: now,
      });
    }
  }

  /**
   * Validates the HMAC-SHA256 signature on an incoming TikTok webhook request.
   *
   * TikTok sends these headers:
   *   x-tiktok-signature   — hex HMAC-SHA256 of (timestamp + nonce + body)
   *   x-tiktok-timestamp   — Unix epoch seconds
   *   x-tiktok-nonce       — random string
   *
   * The signing key is the app's client secret.
   *
   * Reference: https://developers.tiktok.com/doc/webhooks-verification
   */
  private validateWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
  ): void {
    const clientSecret = this.configService.get<string>('tiktok.clientSecret');
    if (!clientSecret) {
      this.logger.warn(
        'TIKTOK_CLIENT_SECRET is not set — webhook signature validation skipped.',
      );
      return;
    }

    const signature = this.getHeader(headers, 'x-tiktok-signature');
    const timestamp = this.getHeader(headers, 'x-tiktok-timestamp');
    const nonce = this.getHeader(headers, 'x-tiktok-nonce');

    if (!signature || !timestamp || !nonce) {
      throw new UnauthorizedException(
        'Missing TikTok webhook signature headers.',
      );
    }

    // Reject requests older than 5 minutes to prevent replay attacks
    const tsSeconds = parseInt(timestamp, 10);
    const ageSeconds = Math.floor(Date.now() / 1000) - tsSeconds;
    if (Math.abs(ageSeconds) > 300) {
      throw new UnauthorizedException(
        'TikTok webhook timestamp is too old (possible replay attack).',
      );
    }

    const bodyString = rawBody.toString('utf8');
    const message = `${timestamp}${nonce}${bodyString}`;
    const expected = crypto
      .createHmac('sha256', clientSecret)
      .update(message)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex'),
      )
    ) {
      throw new UnauthorizedException('TikTok webhook signature mismatch.');
    }
  }

  /** Returns the first string value of a header, regardless of casing. */
  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * Retrieves and decrypts the stored TikTok access token for a user.
   * Used by future publishing/posting services.
   *
   * @throws NotFoundException if no TikTok account is connected.
   */
  async getDecryptedAccessToken(userId: string): Promise<string> {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tiktok'),
      ),
    });

    if (!account?.accessToken) {
      throw new BadRequestException(
        'No connected TikTok account found for this user.',
      );
    }

    return decryptSecret(account.accessToken);
  }
}
