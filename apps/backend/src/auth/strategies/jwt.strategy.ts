import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub?: string; // user id
  userId?: string;
  id?: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          return req?.query?.token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.accessSecret') as string,
    });
  }

  // Whatever is returned here becomes `request.user` in every controller
  async validate(payload: JwtPayload) {
    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired token payload');
    }
    return { userId, id: userId, email: payload.email, role: payload.role };
  }
}
