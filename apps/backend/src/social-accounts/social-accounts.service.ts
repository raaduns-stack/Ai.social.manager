import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { KycService } from '../kyc/kyc.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

import { encryptSecret, decryptSecret } from '../common/utils/encryption.util';


type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    // KycService is injected to enforce KYC-approval before any channel connection
    private readonly kycService: KycService,
    private readonly subscriptionsService: SubscriptionsService,

    private readonly configService: ConfigService,

  ) {}

  /**
   * Create a new social account linked to the given user.
   *
   * KYC GATE: The user must have an APPROVED KYC record before they can
   * connect any social channel. This backend check runs regardless of what
   * the frontend displays, so it cannot be bypassed via API.
   */
  async create(userId: string, dto: CreateSocialAccountDto) {

    // --- KYC Guard ---
    const kycStatus = await this.kycService.getKycStatus(userId);
    if (kycStatus !== 'approved') {
      const codeStatus = kycStatus === 'pending'
        ? 'PENDING_REVIEW'
        : kycStatus === 'rejected'
        ? 'REJECTED'
        : kycStatus === 'resubmission_required'
        ? 'RESUBMISSION_REQUIRED'
        : 'NOT_STARTED';
      throw new ForbiddenException({
        statusCode: 403,
        error: 'KYC_REQUIRED',
        message: 'Complete business verification before connecting a channel.',
        kycStatus: codeStatus,
      });
    }

    let activePlan: schema.Plan;
    try {
      const sub = await this.subscriptionsService.findByUserId(userId);
      activePlan = sub.plan;
    } catch (err) {
      const freePlan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.slug, 'free'),
      });
      activePlan = freePlan || ({
        name: 'Free',
        maxSocialAccounts: 2,
        monthlyPostLimit: 8,
      } as any);
    }

    const maxSocialAccounts = activePlan.maxSocialAccounts;

    const existingConnectedAccounts = await this.db.query.social_accounts.findMany({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.status, 'connected'),
      ),
    });

    if (existingConnectedAccounts.length >= maxSocialAccounts) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${maxSocialAccounts} social accounts allowed under your current plan (${activePlan.name}).`
      );
    }

    const [account] = await this.db
      .insert(schema.social_accounts)
      .values({
        userId,
        platform: dto.platform,
        accountHandle: dto.accountHandle,
        // New accounts start as connected; status can be updated later.
        status: 'connected',
        connectedAt: new Date(),
      })
      .returning();
    return account;
  }

  /** Return all social accounts belonging to the given user. */
  async findAll(userId: string) {
    return this.db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
    });
  }

  /** Update status and token expiration for a specific social account. */
  async update(userId: string, id: string, dto: UpdateSocialAccountDto) {
    if (dto.status === 'connected') {
      const existing = await this.db.query.social_accounts.findFirst({
        where: and(eq(schema.social_accounts.id, id), eq(schema.social_accounts.userId, userId)),
      });
      if (existing && existing.status !== 'connected') {
        let activePlan: schema.Plan;
        try {
          const sub = await this.subscriptionsService.findByUserId(userId);
          activePlan = sub.plan;
        } catch (err) {
          const freePlan = await this.db.query.plans.findFirst({
            where: eq(schema.plans.slug, 'free'),
          });
          activePlan = freePlan || ({ name: 'Free', maxSocialAccounts: 2 } as any);
        }
        const connectedAccounts = await this.db.query.social_accounts.findMany({
          where: and(
            eq(schema.social_accounts.userId, userId),
            eq(schema.social_accounts.status, 'connected'),
          ),
        });
        if (connectedAccounts.length >= activePlan.maxSocialAccounts) {
          throw new BadRequestException(
            `You have reached the maximum limit of ${activePlan.maxSocialAccounts} social accounts allowed under your current plan (${activePlan.name}).`
          );
        }
      }
    }

    const allowedUpdates: Partial<Record<keyof UpdateSocialAccountDto, any>> = {};
    if (dto.status !== undefined) allowedUpdates.status = dto.status;
    if (dto.tokenExpiresAt !== undefined) allowedUpdates.tokenExpiresAt = dto.tokenExpiresAt;

    const [updated] = await this.db
      .update(schema.social_accounts)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.social_accounts.id, id), eq(schema.social_accounts.userId, userId)))
      .returning();
    if (!updated) {
      throw new NotFoundException('Social account not found');
    }
    return updated;
  }

  /** Delete a social account record. */
  async remove(userId: string, id: string) {
    const [deleted] = await this.db
      .delete(schema.social_accounts)
      .where(and(eq(schema.social_accounts.id, id), eq(schema.social_accounts.userId, userId)))
      .returning();
    if (!deleted) {
      throw new NotFoundException('Social account not found');
    }
    return deleted;
  }

  /** Upsert a Tumblr social account with OAuth 1.0a credentials. */
  async upsertTumblr(userId: string, handle: string, token: string, secret: string) {
    const existing = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr')
      ),
    });

    if (existing) {
      const [updated] = await this.db
        .update(schema.social_accounts)
        .set({
          accountHandle: handle,
          accessToken: token,
          tokenSecret: secret,
          status: 'connected',
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.social_accounts.id, existing.id))
        .returning();
      return updated;
    } else {
      // Limit check
      const activeSub = await this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.status, 'active')
        ),
        with: {
          plan: true,
        },
      });

      if (!activeSub || !activeSub.plan) {
        throw new BadRequestException('No active subscription plan found.');
      }

      const maxSocialAccounts = activeSub.plan.maxSocialAccounts;

      const existingAccounts = await this.db.query.social_accounts.findMany({
        where: eq(schema.social_accounts.userId, userId),
      });

      if (existingAccounts.length >= maxSocialAccounts) {
        throw new BadRequestException(
          `You have reached the maximum limit of ${maxSocialAccounts} social accounts allowed under your current plan (${activeSub.plan.name}).`
        );
      }

      const [inserted] = await this.db
        .insert(schema.social_accounts)
        .values({
          userId,
          platform: 'tumblr',
          accountHandle: handle,
          accessToken: token,
          tokenSecret: secret,
          status: 'connected',
          connectedAt: new Date(),
        })
        .returning();
      return inserted;
    }
  }

  /**
   * Generates a cryptographically secured and tamper-proof OAuth state token.
   * State contains userId, timestamp for TTL verification (15 minutes), and a random cryptographic nonce.
   */
  generateOAuthState(userId: string): string {
    const statePayload = JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    });

    const encrypted = encryptSecret(statePayload);
    return Buffer.from(encrypted, 'utf8').toString('base64url');
  }

  /**
   * Validates and decrypts the OAuth state token returned by the OAuth provider.
   * Enforces 15-minute expiration window and integrity check to prevent CSRF attacks.
   */
  validateOAuthState(state: string): { userId: string } {
    if (!state) {
      throw new BadRequestException('Missing OAuth state parameter.');
    }

    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const decrypted = decryptSecret(decoded);
      const data = JSON.parse(decrypted);

      if (!data.userId || !data.timestamp) {
        throw new BadRequestException('Invalid OAuth state payload format.');
      }

      // Enforce 15-minute TTL on state
      const MAX_AGE_MS = 15 * 60 * 1000;
      if (Date.now() - data.timestamp > MAX_AGE_MS) {
        throw new BadRequestException('OAuth state has expired. Please initiate connection again.');
      }

      return { userId: data.userId };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Invalid or tampered OAuth state parameter.');
    }
  }

  /**
   * Constructs the Snapchat OAuth 2.0 Authorization URL for the authenticated user.
   * Gated behind KYC approval and subscription plan social account limits.
   */
  async getSnapchatAuthUrl(userId: string): Promise<string> {
    // --- KYC Guard ---
    const kycStatus = await this.kycService.getKycStatus(userId);
    if (kycStatus !== 'approved') {
      const codeStatus =
        kycStatus === 'pending'
          ? 'PENDING_REVIEW'
          : kycStatus === 'rejected'
          ? 'REJECTED'
          : kycStatus === 'resubmission_required'
          ? 'RESUBMISSION_REQUIRED'
          : 'NOT_STARTED';
      throw new ForbiddenException({
        statusCode: 403,
        error: 'KYC_REQUIRED',
        message: 'Complete business verification before connecting a channel.',
        kycStatus: codeStatus,
      });
    }

    // --- Subscription & Plan Limit Guard ---
    const activeSub = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, 'active'),
      ),
      with: {
        plan: true,
      },
    });

    if (!activeSub || !activeSub.plan) {
      throw new BadRequestException('No active subscription plan found.');
    }

    const maxSocialAccounts = activeSub.plan.maxSocialAccounts;
    const existingAccounts = await this.db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
    });

    if (existingAccounts.length >= maxSocialAccounts) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${maxSocialAccounts} social accounts allowed under your current plan (${activeSub.plan.name}).`,
      );
    }

    // --- Retrieve Snapchat OAuth Settings ---
    const clientId =
      this.configService.get<string>('snapchat.clientId') ||
      process.env.SNAPCHAT_CLIENT_ID;

    if (!clientId) {
      throw new BadRequestException(
        'Snapchat Client ID is not configured on the server. Please set SNAPCHAT_CLIENT_ID.',
      );
    }

    const redirectUri =
      this.configService.get<string>('snapchat.redirectUri') ||
      process.env.SNAPCHAT_REDIRECT_URI ||
      'http://localhost:4000/api/social-accounts/snapchat/callback';

    const authUrlBase =
      this.configService.get<string>('snapchat.authUrl') ||
      process.env.SNAPCHAT_AUTH_URL ||
      'https://accounts.snapchat.com/login/oauth2/authorize';

    const scopes =
      this.configService.get<string>('snapchat.scope') ||
      process.env.SNAPCHAT_SCOPES ||
      'snapchat-profile-api';

    const state = this.generateOAuthState(userId);

    const url = new URL(authUrlBase);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);

    return url.toString();
  }

  /**
   * Validates incoming callback parameters from Snapchat authorization flow.
   * Verifies OAuth state, checks error/cancellation responses, and prepares for token exchange.
   */
  async handleSnapchatCallback(query: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }) {
    // 1. Handle user cancellation or provider error response
    if (query.error) {
      this.logger.warn(
        `Snapchat OAuth error/cancellation received: error=${query.error}, description=${query.error_description || 'none'}`,
      );
      return {
        success: false,
        error: query.error,
        errorDescription:
          query.error_description || 'Snapchat authorization request was denied or cancelled.',
      };
    }

    if (!query.code) {
      throw new BadRequestException('Missing authorization code from Snapchat callback.');
    }

    if (!query.state) {
      throw new BadRequestException('Missing state parameter from Snapchat callback.');
    }

    // 2. Validate state token (authenticity, integrity, expiration)
    const { userId } = this.validateOAuthState(query.state);

    // 3. Confirm user exists in the database
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User associated with OAuth state was not found.');
    }

    // 4. Token exchange foundation
    // NOTE: In the subsequent token exchange stage, backend will:
    // a) POST to SNAPCHAT_TOKEN_URL with code, client_id, client_secret, redirect_uri, grant_type=authorization_code
    // b) Store encrypted access token, refresh token, and token expiration in social_accounts
    // c) Retrieve public profile/display name from Snapchat API to record accountHandle
    // Sensitive credentials (clientSecret, accessToken, refreshToken) are strictly withheld from response.

    this.logger.log(`Snapchat OAuth authorization code verified for user ${userId}. Ready for token exchange.`);

    const clientSecret =
      this.configService.get<string>('snapchat.clientSecret') ||
      process.env.SNAPCHAT_CLIENT_SECRET;

    if (!clientSecret) {
      throw new BadRequestException('Snapchat Client Secret is not configured on the server. Please set SNAPCHAT_CLIENT_SECRET.');
    }

    const clientId =
      this.configService.get<string>('snapchat.clientId') ||
      process.env.SNAPCHAT_CLIENT_ID;

    const redirectUri =
      this.configService.get<string>('snapchat.redirectUri') ||
      process.env.SNAPCHAT_REDIRECT_URI ||
      'http://localhost:4000/api/social-accounts/snapchat/callback';

    const tokenUrl =
      this.configService.get<string>('snapchat.tokenUrl') ||
      process.env.SNAPCHAT_TOKEN_URL ||
      'https://accounts.snapchat.com/login/oauth2/access_token';

    const params = new URLSearchParams();
    params.append('client_id', clientId!);
    params.append('client_secret', clientSecret);
    params.append('code', query.code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    let tokenData: any;
    try {
      this.logger.debug(`Sending token exchange request to ${tokenUrl}`);
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        this.logger.error(
          `Snapchat token exchange failed: ${tokenResponse.status} - ${errText}\n` +
          `Headers: ${JSON.stringify(Object.fromEntries(tokenResponse.headers.entries()))}`
        );
        throw new BadRequestException('Failed to exchange authorization code with Snapchat.');
      }

      tokenData = await tokenResponse.json();
      
      // Log successful token exchange data securely (omitting tokens)
      const { access_token, refresh_token, ...safeTokenData } = tokenData;
      this.logger.debug(`Token exchange successful. Data (omitting tokens): ${JSON.stringify(safeTokenData)}`);

    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Error exchanging Snapchat token: ${err.message}`);
      throw new BadRequestException('Error communicating with Snapchat for token exchange.');
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    let profileData: any;
    try {
      const profileUrl = 'https://businessapi.snapchat.com/v1/public_profiles/my_profile';
      this.logger.debug(`Fetching Snapchat profile from ${profileUrl}`);
      
      const profileResponse = await fetch(profileUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!profileResponse.ok) {
        const errText = await profileResponse.text();
        this.logger.error(
          `Snapchat profile fetch failed: ${profileResponse.status} - ${errText}\n` +
          `Response Headers: ${JSON.stringify(Object.fromEntries(profileResponse.headers.entries()))}`
        );
        throw new ForbiddenException(
          'Failed to retrieve Snapchat Public Profile. Ensure your app is allowlisted for the snapchat-profile-api scope.',
        );
      }

      profileData = await profileResponse.json();
      this.logger.debug(`Snapchat profile fetch successful. Data: ${JSON.stringify(profileData)}`);
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.error(`Error fetching Snapchat profile: ${err.message}`);
      throw new BadRequestException('Error retrieving Snapchat profile data.');
    }

    // Attempt to extract profile details gracefully based on varying Snapchat API response structures
    const profileInfo = profileData?.public_profile || profileData?.me || profileData || {};
    const accountHandle = profileInfo.title || profileInfo.display_name || profileInfo.username || 'Snapchat User';
    const externalAccountId = profileInfo.id || profileInfo.organization_id || 'unknown';
    const profileImageUrl = profileInfo.image_url || profileInfo.avatar_url || profileInfo.logo_url || null;

    // Encrypt sensitive tokens before saving
    const accessTokenEncrypted = encryptSecret(access_token);
    const refreshTokenEncrypted = refresh_token ? encryptSecret(refresh_token) : undefined;
    
    // Calculate expiration date
    const tokenExpiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

    // Upsert the social account connection
    const existingAccounts = await this.db.query.social_accounts.findMany({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'snapchat'),
        eq(schema.social_accounts.externalAccountId, externalAccountId)
      )
    });

    if (existingAccounts.length > 0) {
      await this.db.update(schema.social_accounts)
        .set({
          accountHandle,
          status: 'connected',
          accessTokenEncrypted,
          refreshTokenEncrypted,
          profileImageUrl,
          tokenExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.social_accounts.id, existingAccounts[0].id));
    } else {
      await this.db.insert(schema.social_accounts).values({
        userId,
        platform: 'snapchat',
        accountHandle,
        externalAccountId,
        status: 'connected',
        accessTokenEncrypted,
        refreshTokenEncrypted,
        profileImageUrl,
        tokenExpiresAt,
        connectedAt: new Date(),
      });
    }

    this.logger.log(`Snapchat account connected successfully for user ${userId}.`);

    return {
      success: true,
      message: 'Snapchat account connected successfully.',
      platform: 'snapchat',
      userId,
    };
  }
  /**
   * Periodically check for Snapchat accounts with expiring tokens and refresh them.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndRefreshSnapchatTokens() {
    this.logger.log('Running Snapchat token refresh check...');
    // Find tokens expiring in less than 24 hours
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const accounts = await this.db.query.social_accounts.findMany({
      where: and(
        eq(schema.social_accounts.platform, 'snapchat'),
        eq(schema.social_accounts.status, 'connected'),
        isNotNull(schema.social_accounts.refreshTokenEncrypted),
        lt(schema.social_accounts.tokenExpiresAt, expirationThreshold)
      )
    });

    for (const account of accounts) {
      try {
        await this.refreshSnapchatToken(account.id);
      } catch (err) {
        this.logger.error(`Failed to refresh token for account ${account.id}: ${err}`);
      }
    }
  }

  /**
   * Refreshes a single Snapchat account's access token using its stored refresh token.
   */
  async refreshSnapchatToken(accountId: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: eq(schema.social_accounts.id, accountId)
    });

    if (!account || !account.refreshTokenEncrypted) {
      throw new BadRequestException('Account not found or missing refresh token.');
    }

    const clientId = this.configService.get<string>('snapchat.clientId') || process.env.SNAPCHAT_CLIENT_ID;
    const clientSecret = this.configService.get<string>('snapchat.clientSecret') || process.env.SNAPCHAT_CLIENT_SECRET;
    const tokenUrl = this.configService.get<string>('snapchat.tokenUrl') || process.env.SNAPCHAT_TOKEN_URL || 'https://accounts.snapchat.com/login/oauth2/access_token';

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Snapchat client credentials not configured.');
    }

    const refreshToken = decryptSecret(account.refreshTokenEncrypted);

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Snapchat API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      const newAccessTokenEncrypted = encryptSecret(data.access_token);
      const newRefreshTokenEncrypted = data.refresh_token ? encryptSecret(data.refresh_token) : account.refreshTokenEncrypted;
      const newTokenExpiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined;

      await this.db.update(schema.social_accounts)
        .set({
          accessTokenEncrypted: newAccessTokenEncrypted,
          refreshTokenEncrypted: newRefreshTokenEncrypted,
          tokenExpiresAt: newTokenExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.social_accounts.id, account.id));

      this.logger.log(`Successfully refreshed Snapchat token for account ${account.id}.`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error refreshing Snapchat token for account ${account.id}: ${err.message}`);
      
      await this.db.update(schema.social_accounts)
        .set({
          status: 'action_required',
          updatedAt: new Date(),
        })
        .where(eq(schema.social_accounts.id, account.id));
      
      throw err;

    }
  }
}
