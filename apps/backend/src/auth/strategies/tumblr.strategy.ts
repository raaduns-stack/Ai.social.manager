import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-tumblr';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from '../../social-accounts/social-accounts.service';

@Injectable()
export class TumblrStrategy extends PassportStrategy(Strategy, 'tumblr') {
  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super({
      consumerKey: process.env.TUMBLR_CONSUMER_KEY,
      consumerSecret: process.env.TUMBLR_CONSUMER_SECRET,
      callbackURL: 'http://localhost:3000/auth/tumblr/callback',
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    token: string,
    tokenSecret: string,
    profile: any,
  ): Promise<any> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No session found. Please log in before connecting Tumblr.');
    }

    let userId: string;
    try {
      const secret = this.configService.get<string>('auth.refreshSecret');
      const payload = await this.jwtService.verifyAsync(refreshToken, { secret });
      userId = payload.sub;
    } catch (err) {
      throw new UnauthorizedException('Session expired or invalid. Please log in again.');
    }

    const blogName =
      profile.username ||
      profile.displayName ||
      profile._json?.response?.user?.blogs?.[0]?.name ||
      'tumblr_blog';

    await this.socialAccountsService.upsertTumblr(userId, blogName, token, tokenSecret);

    return {
      userId,
      blogName,
      token,
      tokenSecret,
      profile,
    };
  }
}
