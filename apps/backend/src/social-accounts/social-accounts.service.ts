import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { KycService } from '../kyc/kyc.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SocialAccountsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    // KycService is injected to enforce KYC-approval before any channel connection
    private readonly kycService: KycService,
    private readonly subscriptionsService: SubscriptionsService,
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
}
