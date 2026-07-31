import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { UserRole } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        businessName: dto.businessName,
        role: UserRole.USER,
      })
      .returning();

    // Auto-assign the free plan
    const freePlan = await this.db.query.plans.findFirst({
      where: eq(schema.plans.slug, 'free'),
    });
    if (!freePlan) {
      throw new InternalServerErrorException(
        'Free plan not found. Please seed a plan with slug "free" before accepting registrations.',
      );
    }

    await this.db.insert(schema.subscriptions).values({
      userId: user.id,
      planId: freePlan.id,
      status: 'active',
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been suspended');
    }

    return this.issueTokens(user);
  }

  async refresh(userId: string, email: string, role: string) {
    // Re-issues a new access/refresh pair. In production, pair this with a
    // refresh-token allowlist/blocklist table so tokens can be revoked on logout.
    return this.signTokens({ sub: userId, email, role });
  }

  private async issueTokens(user: schema.User) {
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        role: user.role,
      },
      ...tokens,
    };
  }

  private async signTokens(payload: { sub: string; email: string; role: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.accessSecret'),
        expiresIn: this.configService.get<string>('auth.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.refreshSecret'),
        expiresIn: this.configService.get<string>('auth.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
