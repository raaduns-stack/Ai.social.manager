import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import OAuth from 'oauth-1.0a';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { SocialAccountsService } from '../../social-accounts/social-accounts.service';

type Database = PostgresJsDatabase<typeof schema>;

export interface TumblrBlogInfo {
  name: string;
  title: string;
  url: string;
  avatarUrl?: string;
  primary?: boolean;
}

@Injectable()
export class TumblrService {
  private readonly logger = new Logger(TumblrService.name);
  private readonly oauth: OAuth;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly socialAccountsService: SocialAccountsService,
  ) {
    const consumerKey =
      this.configService.get<string>('tumblr.consumerKey') ||
      process.env.TUMBLR_CONSUMER_KEY ||
      '';
    const consumerSecret =
      this.configService.get<string>('tumblr.consumerSecret') ||
      process.env.TUMBLR_CONSUMER_SECRET ||
      '';

    this.oauth = new OAuth({
      consumer: {
        key: consumerKey,
        secret: consumerSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      },
    });
  }

  // ---------------------------------------------------------------------------
  // State JWT (CSRF & User context preservation across OAuth redirects)
  // ---------------------------------------------------------------------------
  async generateStateJwt(userId: string): Promise<string> {
    const secret =
      this.configService.get<string>('auth.accessSecret') ||
      process.env.JWT_ACCESS_SECRET ||
      'raasocial_secret';

    return this.jwtService.signAsync(
      { sub: userId, type: 'tumblr_oauth_state' },
      { secret, expiresIn: '15m' },
    );
  }

  async verifyStateJwt(state: string): Promise<{ userId: string }> {
    try {
      const secret =
        this.configService.get<string>('auth.accessSecret') ||
        process.env.JWT_ACCESS_SECRET ||
        'raasocial_secret';

      const payload = await this.jwtService.verifyAsync(state, { secret });
      if (payload.type !== 'tumblr_oauth_state' || !payload.sub) {
        throw new BadRequestException('Invalid OAuth state parameter.');
      }
      return { userId: payload.sub };
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state parameter.');
    }
  }

  // ---------------------------------------------------------------------------
  // OAuth 1.0a Flow
  // ---------------------------------------------------------------------------
  async getRequestToken(): Promise<{ oauth_token: string; oauth_token_secret: string }> {
    const requestTokenUrl = 'https://www.tumblr.com/oauth/request_token';
    const backendUrl =
      this.configService.get<string>('backendUrl') ||
      process.env.BACKEND_URL ||
      'http://localhost:4000';
    const apiPrefix =
      this.configService.get<string>('apiPrefix') ||
      process.env.API_PREFIX ||
      'api';

    const callbackUrl =
      this.configService.get<string>('tumblr.callbackUrl') ||
      process.env.TUMBLR_CALLBACK_URL ||
      `${backendUrl}/${apiPrefix}/channels/tumblr/callback`;

    const requestData = {
      url: requestTokenUrl,
      method: 'POST',
      data: {
        oauth_callback: callbackUrl,
      },
    };

    const headers = this.oauth.toHeader(this.oauth.authorize(requestData));

    const response = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestData.data).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to obtain Tumblr request token (${response.status}): ${errorText}`,
      );
      throw new BadRequestException(
        `Failed to obtain request token from Tumblr: ${errorText}`,
      );
    }

    const responseData = await response.text();
    const params = new URLSearchParams(responseData);

    const oauth_token = params.get('oauth_token');
    const oauth_token_secret = params.get('oauth_token_secret');

    if (!oauth_token || !oauth_token_secret) {
      throw new BadRequestException(
        'Tumblr did not return oauth_token or oauth_token_secret.',
      );
    }

    return { oauth_token, oauth_token_secret };
  }

  async getAccessToken(
    oauthToken: string,
    oauthTokenSecret: string,
    oauthVerifier: string,
  ): Promise<{ token: string; tokenSecret: string }> {
    const accessTokenUrl = 'https://www.tumblr.com/oauth/access_token';

    const requestData = {
      url: accessTokenUrl,
      method: 'POST',
      data: {
        oauth_verifier: oauthVerifier,
      },
    };

    const tokenOptions = {
      key: oauthToken,
      secret: oauthTokenSecret,
    };

    const authorization = this.oauth.authorize(requestData, tokenOptions);
    const headers = this.oauth.toHeader(authorization);

    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestData.data).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to exchange access token with Tumblr (${response.status}): ${errorText}`,
      );
      throw new BadRequestException(
        `Failed to exchange access token with Tumblr: ${errorText}`,
      );
    }

    const responseData = await response.text();
    const params = new URLSearchParams(responseData);

    const token = params.get('oauth_token');
    const tokenSecret = params.get('oauth_token_secret');

    if (!token || !tokenSecret) {
      throw new BadRequestException(
        'Tumblr did not return access oauth_token or oauth_token_secret.',
      );
    }

    return { token, tokenSecret };
  }

  // ---------------------------------------------------------------------------
  // Profile & Blogs
  // ---------------------------------------------------------------------------
  async getUserProfileAndBlogs(token: string, tokenSecret: string): Promise<{
    user: any;
    blogs: TumblrBlogInfo[];
    primaryBlogName: string;
  }> {
    const userInfoUrl = 'https://api.tumblr.com/v2/user/info';

    const requestData = {
      url: userInfoUrl,
      method: 'GET',
    };

    const tokenOptions = {
      key: token,
      secret: tokenSecret,
    };

    const headers = this.oauth.toHeader(
      this.oauth.authorize(requestData, tokenOptions),
    );

    const response = await fetch(userInfoUrl, {
      method: 'GET',
      headers: { ...headers },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to fetch Tumblr user info (${response.status}): ${errorText}`,
      );
      throw new BadRequestException(
        `Failed to retrieve user profile from Tumblr: ${errorText}`,
      );
    }

    const json: any = await response.json();
    const userData = json.response?.user;
    const rawBlogs = userData?.blogs || [];

    const blogs: TumblrBlogInfo[] = rawBlogs.map((b: any) => ({
      name: b.name,
      title: b.title || b.name,
      url: b.url,
      avatarUrl: `https://api.tumblr.com/v2/blog/${b.name}/avatar/128`,
      primary: b.primary ?? false,
    }));

    const primaryBlog = blogs.find((b) => b.primary) || blogs[0];
    const primaryBlogName = primaryBlog ? primaryBlog.name : userData?.name || 'tumblr_blog';

    return { user: userData, blogs, primaryBlogName };
  }

  async connectAccount(userId: string, token: string, tokenSecret: string, blogName: string) {
    return this.socialAccountsService.upsertTumblr(userId, blogName, token, tokenSecret);
  }

  // ---------------------------------------------------------------------------
  // Account Status & Disconnect
  // ---------------------------------------------------------------------------
  async getTumblrStatus(userId: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr'),
      ),
    });

    if (!account || account.status !== 'connected') {
      return { connected: false, platform: 'tumblr' };
    }

    return {
      connected: true,
      platform: 'tumblr',
      accountId: account.id,
      blogName: account.accountHandle,
      avatarUrl: account.accountHandle
        ? `https://api.tumblr.com/v2/blog/${account.accountHandle}/avatar/128`
        : null,
      connectedAt: account.connectedAt,
    };
  }

  async disconnectTumblr(userId: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr'),
      ),
    });

    if (!account) {
      throw new NotFoundException('No connected Tumblr account found.');
    }

    await this.db
      .delete(schema.social_accounts)
      .where(eq(schema.social_accounts.id, account.id));

    return { success: true, message: 'Tumblr connection removed successfully.' };
  }

  async selectTargetBlog(userId: string, blogName: string) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr'),
      ),
    });

    if (!account) {
      throw new NotFoundException('No connected Tumblr account found for this user.');
    }

    await this.db
      .update(schema.social_accounts)
      .set({
        accountHandle: blogName,
        updatedAt: new Date(),
      })
      .where(eq(schema.social_accounts.id, account.id));

    return {
      success: true,
      blogName,
      message: `Target Tumblr blog updated to ${blogName}.`,
    };
  }

  async getUserBlogs(userId: string): Promise<TumblrBlogInfo[]> {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr'),
      ),
    });

    if (!account || !account.accessToken || !account.tokenSecret) {
      throw new NotFoundException('No connected Tumblr credentials found.');
    }

    const { blogs } = await this.getUserProfileAndBlogs(
      account.accessToken,
      account.tokenSecret,
    );

    return blogs;
  }

  // ---------------------------------------------------------------------------
  // Post Dispatch / Send Post
  // ---------------------------------------------------------------------------
  async sendPost(
    userId: string,
    params: {
      blogName?: string;
      content: string;
      title?: string;
      mediaUrl?: string;
      type?: 'text' | 'photo' | 'link';
    },
  ) {
    const account = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.platform, 'tumblr'),
      ),
    });

    if (!account || !account.accessToken || !account.tokenSecret) {
      throw new NotFoundException('No connected Tumblr account found for this user.');
    }

    const targetBlog = params.blogName || account.accountHandle;

    if (!targetBlog) {
      throw new BadRequestException(
        'No target Tumblr blog specified or configured for this user.',
      );
    }

    const postUrl = `https://api.tumblr.com/v2/blog/${targetBlog}/post`;
    const postType = params.type || (params.mediaUrl ? 'photo' : 'text');

    const postData: Record<string, string> = {
      type: postType,
    };

    if (postType === 'photo' && params.mediaUrl) {
      postData['source'] = params.mediaUrl;
      if (params.content) {
        postData['caption'] = params.content;
      }
    } else if (postType === 'link') {
      postData['url'] = params.mediaUrl || '';
      if (params.title) postData['title'] = params.title;
      if (params.content) postData['description'] = params.content;
    } else {
      if (params.title) postData['title'] = params.title;
      postData['body'] = params.content;
    }

    const requestData = {
      url: postUrl,
      method: 'POST',
      data: postData,
    };

    const tokenOptions = {
      key: account.accessToken,
      secret: account.tokenSecret,
    };

    const authorization = this.oauth.authorize(requestData, tokenOptions);
    const headers = this.oauth.toHeader(authorization);

    const bodyParams = new URLSearchParams(postData).toString();

    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams,
    });

    const json: any = await response.json();

    if (!response.ok) {
      this.logger.error(
        `Tumblr post creation failed (${response.status}): ${JSON.stringify(json)}`,
      );
      throw new BadRequestException(
        `Tumblr API error (${response.status}): ${json.meta?.msg || json.response?.errors?.[0] || JSON.stringify(json)}`,
      );
    }

    const postId = json.response?.id_string || json.response?.id || 'unknown';

    return {
      success: true,
      postId: String(postId),
      blogName: targetBlog,
      postUrl: `https://${targetBlog}.tumblr.com/post/${postId}`,
    };
  }
}
