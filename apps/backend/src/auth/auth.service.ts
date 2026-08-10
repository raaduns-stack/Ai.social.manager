import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '../mailer/mailer.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

import { UserRole } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly resendLimits = new Map<string, number>();

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) { }

  /**
   * Registers a new user.
   * 
   * This function checks if the email is already in use, hashes the password,
   * generates an email verification code, inserts the user into the database,
   * and assigns them the default "free" subscription plan.
   * Finally, it sends a verification email and returns the authentication tokens.
   * 
   * @param dto The user's registration data (email, password, etc.)
   * @returns An object containing the created user and JWT tokens
   */
  async register(dto: RegisterDto) {
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        businessName: dto.businessName,
        isEmailVerified: false,
        emailVerificationCode: code,
        emailVerificationExpiresAt: expiresAt,
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

    await this.mailerService.sendVerificationCode(user, code);

    return this.issueTokens(user);
  }

  /**
   * Authenticates a user.
   * 
   * This function verifies the user's email exists, compares the provided password hash,
   * ensures the account is not suspended, and checks if the email has been verified.
   * If all checks pass, it generates and returns JWT tokens.
   * 
   * @param dto The user's login credentials (email, password)
   * @returns An object containing the authenticated user and JWT tokens
   */
  async login(dto: LoginDto) {
    console.log('[DEBUG Auth] Login Attempt:', { email: dto.email, passwordLength: dto.password?.length });
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (!user) {
      console.log('[DEBUG Auth] User not found for email:', dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    console.log('[DEBUG Auth] Password comparison result:', {
      email: dto.email,
      hashInDB: user.passwordHash,
      passwordMatches
    });

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      console.log('[DEBUG Auth] User is inactive:', dto.email);
      throw new UnauthorizedException('This account has been suspended');
    }

    if (!user.isEmailVerified) {
      console.log('[DEBUG Auth] User email not verified:', dto.email);
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Your email address is not verified. Please verify your email to log in.',
        errorCode: 'EMAIL_NOT_VERIFIED',
      });
    }

    console.log('[DEBUG Auth] Login successful, issuing tokens for:', dto.email);
    return this.issueTokens(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.emailVerificationCode !== dto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerificationExpiresAt && new Date() > user.emailVerificationExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    await this.mailerService.sendWelcomeEmail(updatedUser);

    return this.issueTokens(updatedUser);
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email;
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Rate limiting: 1 request per 30 seconds per email
    const lastSent = this.resendLimits.get(email);
    const now = Date.now();
    if (lastSent && now - lastSent < 30000) {
      const secondsLeft = Math.ceil((30000 - (now - lastSent)) / 1000);
      throw new BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code.`);
    }
    this.resendLimits.set(email, now);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        emailVerificationCode: code,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    await this.mailerService.sendVerificationCode(updatedUser, code);

    return { message: 'Verification code resent' };
  }

  async refresh(userId: string, email: string, role: string) {
    // Re-issues a new access/refresh pair. In production, pair this with a
    // refresh-token allowlist/blocklist table so tokens can be revoked on logout.
    return this.signTokens({ sub: userId, email, role });
  }

  /**
   * Issues new access and refresh JWT tokens for a user.
   * 
   * It signs the tokens with the user's ID, email, and role. It also looks up
   * the user's active subscription plan from the database and embeds it in the 
   * returned user object so the frontend has immediate access to their plan tier.
   * 
   * @param user The user entity from the database
   * @returns An object containing the user data and the newly generated tokens
   */
  private async issueTokens(user: schema.User) {
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Fetch the active plan to embed in the login payload
    const activeSub = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, user.id),
        eq(schema.subscriptions.status, 'active')
      ),
      with: { plan: true },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        role: user.role,
        plan: activeSub?.plan || null,
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
