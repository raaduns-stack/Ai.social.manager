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
import { Request } from 'express';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '../mailer/mailer.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserRole } from '../common/enums/roles.enum';
import { LoginHistoryService } from '../login-history/login-history.service';
import { LoginStatus } from '../common/enums/login-status.enum';
import { LoginFailureReason } from '../common/enums/login-failure-reason.enum';
import { extractIp } from '../common/utils/request-ip.util';
import { parseUserAgent } from '../common/utils/user-agent.util';
import { resolveGeoLocation } from '../common/utils/geolocation.util';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

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
    private readonly loginHistoryService: LoginHistoryService,
    private readonly activityLogsService: ActivityLogsService,
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
      if (existing.accountStatus === 'EMAIL_VERIFICATION_PENDING') {
        const lastSent = this.resendLimits.get(dto.email);
        const now = Date.now();
        if (lastSent && now - lastSent < 30000) {
          const secondsLeft = Math.ceil((30000 - (now - lastSent)) / 1000);
          throw new BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code.`);
        }
        this.resendLimits.set(dto.email, now);

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const [updatedUser] = await this.db
          .update(schema.users)
          .set({
            emailVerificationCode: code,
            emailVerificationExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing.id))
          .returning();

        await this.mailerService.sendVerificationCode(updatedUser, code);

        return { requiresVerification: true, email: existing.email };
      }
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [user] = await this.db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(schema.users)
        .values({
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          businessName: dto.businessName,
          phoneNumber: dto.phoneNumber,
          country: dto.country,
          emailVerificationCode: code,
          emailVerificationExpiresAt: expiresAt,
          registeredAt: new Date(),
        })
        .returning();

      await this.applyUserStatusTransition(createdUser.id, 'EMAIL_VERIFICATION_PENDING', tx);

      return [createdUser];
    });

    // Auto-assign the free plan (within transaction context)
    const [userWithPlan] = await this.db.transaction(async (tx) => {
      const freePlan = await tx.query.plans.findFirst({
        where: eq(schema.plans.slug, 'free'),
      });
      if (!freePlan) {
        throw new InternalServerErrorException(
          'Free plan not found. Please seed a plan with slug "free" before accepting registrations.',
        );
      }

      await tx.insert(schema.subscriptions).values({
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
      });
      return [freePlan];
    });

    await this.mailerService.sendVerificationCode(user, code);

    // Record new user registration
    void this.activityLogsService.record({
      userId: user.id,
      userName: user.fullName,
      action: 'USER_REGISTERED',
      module: 'Auth',
      description: `New user registered: ${user.email}`,
    });

    return this.issueTokens(user);
  }

  /**
   * Authenticates a user and records the login attempt in history.
   *
   * This function verifies the user's email exists, compares the provided password hash,
   * ensures the account is not suspended, and checks if the email has been verified.
   * If all checks pass, it generates and returns JWT tokens.
   *
   * @param dto The user's login credentials (email, password)
   * @param req The Express request object (used to extract IP and User-Agent for audit logging)
   * @returns An object containing the authenticated user and JWT tokens
   */
  async login(dto: LoginDto, req?: Request) {
    const ip = req ? extractIp(req) : null;
    const ua = parseUserAgent(req?.headers['user-agent']);
    const geo = ip ? await resolveGeoLocation(ip) : { country: null, city: null, region: null };

    const baseAudit = {
      email: dto.email,
      ipAddress: ip,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      userAgentRaw: ua.raw || null,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
    };

    console.log('[DEBUG Auth] Login Attempt:', { email: dto.email, passwordLength: dto.password?.length });

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });

    if (!user) {
      console.log('[DEBUG Auth] User not found for email:', dto.email);
      // Record failed attempt — no userId since account doesn't exist
      await this.loginHistoryService.record({
        ...baseAudit,
        userId: null,
        status: LoginStatus.FAILURE,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    console.log('[DEBUG Auth] Password comparison result:', {
      email: dto.email,
      passwordMatches,
    });

    if (!passwordMatches) {
      await this.loginHistoryService.record({
        ...baseAudit,
        userId: user.id,
        status: LoginStatus.FAILURE,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    switch (user.accountStatus) {
      case 'SUSPENDED': {
        await this.loginHistoryService.record({
          ...baseAudit,
          userId: user.id,
          status: LoginStatus.FAILURE,
          failureReason: LoginFailureReason.ACCOUNT_INACTIVE,
        });
        throw new ForbiddenException({
          statusCode: 403,
          message: 'This account has been suspended',
          errorCode: 'ACCOUNT_SUSPENDED',
        });
      }

      case 'DELETED': {
        await this.loginHistoryService.record({
          ...baseAudit,
          userId: user.id,
          status: LoginStatus.FAILURE,
          failureReason: LoginFailureReason.ACCOUNT_INACTIVE,
        });
        throw new ForbiddenException({
          statusCode: 403,
          message: 'This account has been deleted',
          errorCode: 'ACCOUNT_DELETED',
        });
      }

      case 'EMAIL_VERIFICATION_PENDING': {
        await this.loginHistoryService.record({
          ...baseAudit,
          userId: user.id,
          status: LoginStatus.FAILURE,
          failureReason: LoginFailureReason.EMAIL_NOT_VERIFIED,
        });

        const lastSent = this.resendLimits.get(user.email);
        const now = Date.now();
        if (lastSent && now - lastSent < 30000) {
          const secondsLeft = Math.ceil((30000 - (now - lastSent)) / 1000);
          throw new BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code.`);
        }
        this.resendLimits.set(user.email, now);

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

        return { requiresVerification: true, email: user.email };
      }

      case 'REGISTRATION_IN_PROGRESS':
      case 'ACTIVE': {
        break;
      }

      default: {
        await this.loginHistoryService.record({
          ...baseAudit,
          userId: user.id,
          status: LoginStatus.FAILURE,
          failureReason: LoginFailureReason.ACCOUNT_INACTIVE,
        });
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Invalid account status',
          errorCode: 'ACCOUNT_STATUS_INVALID',
        });
      }
    }

    // All checks passed — update login timestamps and set status to ACTIVE if needed
    const updatedUser = await this.applyUserStatusTransition(user.id, 'ACTIVE', undefined, true);

    await this.loginHistoryService.record({
      ...baseAudit,
      userId: user.id,
      status: LoginStatus.SUCCESS,
    });

    // Record activity log for successful login
    void this.activityLogsService.record({
      userId: user.id,
      userName: user.fullName,
      action: 'USER_LOGIN',
      module: 'Auth',
      description: `User logged in: ${user.email}`,
    });

    console.log('[DEBUG Auth] Login successful, issuing tokens for:', dto.email);
    return this.issueTokens(updatedUser);
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

    const updatedUser = await this.db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));

      return await this.applyUserStatusTransition(user.id, 'REGISTRATION_IN_PROGRESS', tx);
    });

    await this.mailerService.sendWelcomeEmail(updatedUser);

    return {
      success: true,
      message: 'Email successfully verified. Please log in to complete your registration.',
      redirectTo: '/login',
    };
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

  async changePassword(userId: string, dto: import('./dto/change-password.dto').ChangePasswordDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.db
      .update(schema.users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    return { message: 'Password updated successfully' };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('auth.refreshSecret'),
      });

      // 2. Generate new tokens
      const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
      
      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.configService.get<string>('auth.accessSecret'),
        expiresIn: this.configService.get<string>('auth.accessExpiresIn'),
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        secret: this.configService.get<string>('auth.refreshSecret'),
        expiresIn: this.configService.get<string>('auth.refreshExpiresIn'),
      });

      return {
        accessToken: newAccessToken,
        newRefreshToken: newRefreshToken
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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
  async updateProfileImage(userId: string, filename: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(schema.users)
      .set({
        profileImage: filename,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    return {
      success: true,
      profileImage: updated.profileImage,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    const activeSub = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, user.id),
        eq(schema.subscriptions.status, 'active'),
      ),
      with: { plan: true },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
    });

    const perms = await this.getPermissions(user.id, user.role);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phoneNumber: user.phoneNumber,
      country: user.country,
      profileImage: user.profileImage,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      plan: activeSub?.plan || null,
      permissions: perms.permissions,
    };
  }

  async getPermissions(userId: string, role: string) {
    const perms = await this.db.query.rolePermissions.findMany({
      where: eq(schema.rolePermissions.role, role as any),
    });

    const permissions: Record<string, string> = {};
    for (const p of perms) {
      permissions[p.module] = p.accessLevel;
    }

    return {
      role,
      permissions,
    };
  }

  private async issueTokens(user: schema.User) {
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Fetch the active plan to embed in the login payload
    let activeSub: any = null;
    try {
      activeSub = await this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.userId, user.id),
          eq(schema.subscriptions.status, 'active')
        ),
        with: { plan: true },
        orderBy: (subscriptions, { desc }) => [desc(subscriptions.updatedAt)],
      });
    } catch (err) {
      console.error('[ERROR Auth] Failed to fetch active subscription for user:', user.id, err);
      throw new InternalServerErrorException(
        `Failed to fetch subscription: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const perms = await this.getPermissions(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        phoneNumber: user.phoneNumber,
        country: user.country,
        profileImage: user.profileImage,
        role: user.role,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        plan: activeSub?.plan || null,
        permissions: perms.permissions,
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

  async applyUserStatusTransition(
    userId: string,
    newStatus: 'EMAIL_VERIFICATION_PENDING' | 'REGISTRATION_IN_PROGRESS' | 'ACTIVE' | 'SUSPENDED' | 'DELETED',
    tx?: any,
    isLogin = false,
  ): Promise<schema.User> {
    const executor = tx || this.db;
    const now = new Date();
    const user = await executor.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {
      updatedAt: now,
    };

    switch (newStatus) {
      case 'EMAIL_VERIFICATION_PENDING':
        updateData.accountStatus = 'EMAIL_VERIFICATION_PENDING';
        updateData.isActive = false;
        updateData.isEmailVerified = false;
        break;

      case 'REGISTRATION_IN_PROGRESS':
        updateData.accountStatus = 'REGISTRATION_IN_PROGRESS';
        updateData.isEmailVerified = true;
        updateData.emailVerifiedAt = now;
        updateData.isActive = false;
        break;

      case 'ACTIVE':
        updateData.accountStatus = 'ACTIVE';
        updateData.isActive = true;
        updateData.suspendedAt = null;
        if (isLogin) {
          updateData.lastLoginAt = now;
          if (!user.firstLoginAt) {
            updateData.firstLoginAt = now;
          }
        }
        break;

      case 'SUSPENDED':
        updateData.accountStatus = 'SUSPENDED';
        updateData.isActive = false;
        updateData.suspendedAt = now;
        break;

      case 'DELETED':
        updateData.accountStatus = 'DELETED';
        updateData.isActive = false;
        updateData.deletedAt = now;
        break;

      default:
        throw new BadRequestException(`Invalid status transition: ${newStatus}`);
    }

    const [updatedUser] = await executor
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();

    return updatedUser;
  }
}

