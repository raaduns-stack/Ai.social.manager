import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import OAuth from 'oauth-1.0a';
import * as crypto from 'crypto';

@Injectable()
export class TumblrService {
  private readonly oauth: OAuth;
  private readonly logger = new Logger(TumblrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly socialAccountsService: SocialAccountsService,
  ) {
    const consumerKey = process.env.TUMBLR_CONSUMER_KEY;
    const consumerSecret = process.env.TUMBLR_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error('TUMBLR_CONSUMER_KEY or TUMBLR_CONSUMER_SECRET is missing from environmental variables.');
    }

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

  async getRequestToken(): Promise<{ oauth_token: string; oauth_token_secret: string }> {
    const requestTokenUrl = 'https://www.tumblr.com/oauth/request_token';
    const backendUrl = this.configService.get<string>('backendUrl') || process.env.BACKEND_URL || 'http://localhost:4000';
    const apiPrefix = this.configService.get<string>('apiPrefix') || process.env.API_PREFIX || 'api';
    const callbackUrl =
      this.configService.get<string>('tumblr.callbackUrl') ||
      process.env.TUMBLR_CALLBACK_URL ||
      `${backendUrl}/${apiPrefix}/auth/tumblr/callback`;

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
      this.logger.error(`Failed to obtain request token: Status ${response.status}, Body: ${errorText}`);
      throw new BadRequestException(`Failed to obtain request token from Tumblr: ${errorText}`);
    }

    const responseData = await response.text();
    const params = new URLSearchParams(responseData);

    const oauth_token = params.get('oauth_token');
    const oauth_token_secret = params.get('oauth_token_secret');

    if (!oauth_token || !oauth_token_secret) {
      throw new BadRequestException('Tumblr did not return oauth_token or oauth_token_secret.');
    }

    return { oauth_token, oauth_token_secret };
  }

  async getAccessToken(
    oauthToken: string,
    oauthTokenSecret: string,
    oauthVerifier: string,
  ): Promise<{ token: string; tokenSecret: string; blogName: string }> {
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

    // Temporarily log signature base string and Authorization header for debugging
    const signatureBaseString = this.oauth.getParameterString(requestData, authorization);
    this.logger.log(`[Tumblr debug] Signature Base String: ${signatureBaseString}`);
    this.logger.log(`[Tumblr debug] Authorization Header: ${headers.Authorization}`);

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
      this.logger.error(`Failed to exchange access token: Status ${response.status}, Body: ${errorText}`);
      throw new BadRequestException(`Failed to exchange access token with Tumblr: ${errorText}`);
    }

    const responseData = await response.text();
    const params = new URLSearchParams(responseData);

    const token = params.get('oauth_token');
    const tokenSecret = params.get('oauth_token_secret');

    if (!token || !tokenSecret) {
      throw new BadRequestException('Tumblr did not return access oauth_token or oauth_token_secret.');
    }

    const blogName = await this.fetchBlogName(token, tokenSecret);

    return { token, tokenSecret, blogName };
  }

  private async fetchBlogName(token: string, tokenSecret: string): Promise<string> {
    const userInfoUrl = 'https://api.tumblr.com/v2/user/info';

    const requestData = {
      url: userInfoUrl,
      method: 'GET',
    };

    const tokenOptions = {
      key: token,
      secret: tokenSecret,
    };

    const headers = this.oauth.toHeader(this.oauth.authorize(requestData, tokenOptions));

    const response = await fetch(userInfoUrl, {
      method: 'GET',
      headers: { ...headers },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to fetch Tumblr user info: Status ${response.status}, Body: ${errorText}`);
      throw new BadRequestException(`Failed to retrieve user profile from Tumblr: ${errorText}`);
    }

    const json: any = await response.json();
    const blogName =
      json.response?.user?.name ||
      json.response?.user?.blogs?.[0]?.name ||
      'tumblr_blog';

    return blogName;
  }

  async connectAccount(userId: string, token: string, tokenSecret: string, blogName: string): Promise<void> {
    await this.socialAccountsService.upsertTumblr(userId, blogName, token, tokenSecret);
  }
}
