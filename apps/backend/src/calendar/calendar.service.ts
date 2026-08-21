import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, desc, eq, gte, lte, ne } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ConfigService } from '@nestjs/config';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { ContentCalendarPost } from '../database/schema/content-calendar.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CustomerProfileService } from '../settings/customer-profile/customer-profile.service';

type Database = PostgresJsDatabase<typeof schema>;

/** Shape of the body when creating a new calendar post. */
export interface CreateCalendarPostDto {
  title: string;
  caption: string;
  platform: 'Instagram' | 'LinkedIn' | 'X / Twitter' | 'TikTok' | 'Facebook';
  scheduledAt?: string;   // ISO 8601 string
  mediaUrl?: string;
  hashtags?: string[];
  aiGenerated?: boolean;
}

/** Shape of the body when updating an existing calendar post. */
export interface UpdateCalendarPostDto {
  title?: string;
  caption?: string;
  platform?: 'Instagram' | 'LinkedIn' | 'X / Twitter' | 'TikTok' | 'Facebook';
  scheduledAt?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  mediaUrl?: string | null;
  hashtags?: string[];
  aiGenerated?: boolean;
  selectedSuggestionId?: string | null;
}

/** Shape of the body when updating approval status (admin only). */
export interface UpdateApprovalDto {
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
  adminNotes?: string;
}

const CALENDAR_TO_DB_PLATFORM: Record<string, string> = {
  'Instagram': 'instagram',
  'LinkedIn': 'linkedin',
  'X / Twitter': 'x',
  'TikTok': 'tiktok',
  'Facebook': 'facebook',
};

const DB_TO_CALENDAR_PLATFORM: Record<string, string> = {
  'instagram': 'Instagram',
  'linkedin': 'LinkedIn',
  'x': 'X / Twitter',
  'tiktok': 'TikTok',
  'facebook': 'Facebook',
};

@Injectable()
export class CalendarService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
    private readonly customerProfileService: CustomerProfileService,
  ) { }

  getWeekRange(date: Date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Start of week (Sunday 00:00:00.000)
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    start.setHours(0, 0, 0, 0);
    
    // End of week (Saturday 23:59:59.999)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  async getConnectedPlatformsForUser(userId: string): Promise<string[]> {
    const accounts = await this.db.query.social_accounts.findMany({
      where: and(
        eq(schema.social_accounts.userId, userId),
        eq(schema.social_accounts.status, 'connected'),
      ),
    });
    return accounts
      .map(acc => DB_TO_CALENDAR_PLATFORM[acc.platform])
      .filter(Boolean);
  }

  async checkWeeklyPostLimit(userId: string, targetDate: Date, postId?: string) {
    let subscription;
    try {
      subscription = await this.subscriptionsService.findByUserId(userId);
    } catch (err) {
      subscription = { plan: { slug: 'free' } };
    }
    const slug = subscription?.plan?.slug || 'free';
    if (slug !== 'free') {
      return; // Only free plan has weekly post limits
    }

    const { start, end } = this.getWeekRange(targetDate);

    // Query posts scheduled in this week
    const posts = await this.db.query.contentCalendar.findMany({
      where: (fields, { and, eq, gte, lte, ne }) =>
        and(
          eq(fields.userId, userId),
          gte(fields.scheduledAt, start),
          lte(fields.scheduledAt, end),
          postId ? ne(fields.id, postId) : undefined,
        ),
    });

    if (posts.length >= 2) {
      throw new BadRequestException(
        `Weekly post limit reached. Under the Free plan, you can schedule at most 2 posts per week.`
      );
    }
  }

  /**
   * Helper function to check whether a customer has reached their monthly calendar post limit.
   */
  async checkPostLimit(userId: string, targetDate: Date, postId?: string) {
    let limit = 8;
    let planName = 'Free';
    let subscription;
    try {
      subscription = await this.subscriptionsService.findByUserId(userId);
    } catch (err) {
      subscription = null;
    }

    if (subscription?.plan) {
      limit = subscription.plan.monthlyPostLimit;
      planName = subscription.plan.name;
    } else {
      const freePlan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.slug, 'free'),
      });
      if (freePlan) {
        limit = freePlan.monthlyPostLimit;
        planName = freePlan.name;
      }
    }

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const posts = await this.db.query.contentCalendar.findMany({
      where: (fields, { and, eq, gte, lte, ne }) =>
        and(
          eq(fields.userId, userId),
          gte(fields.scheduledAt, startOfMonth),
          lte(fields.scheduledAt, endOfMonth),
          postId ? ne(fields.id, postId) : undefined,
        ),
    });

    if (posts.length >= limit) {
      throw new BadRequestException(
        `Monthly post limit reached. Your plan (${planName}) allows a maximum of ${limit} posts per month. You currently have ${posts.length} scheduled/published in this month.`
      );
    }
  }

  // ─── Customer endpoints ──────────────────────────────────────────────────────

  /**
   * Return all posts for the authenticated customer.
   * Optionally filter by status (DRAFT | SCHEDULED | PUBLISHED).
   */
  async findAllForUser(
    userId: string,
    status?: string,
  ): Promise<ContentCalendarPost[]> {
    const conditions = [eq(schema.contentCalendar.userId, userId)];

    if (status && status !== 'ALL') {
      const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new BadRequestException(`Invalid status: ${status}`);
      }
      conditions.push(
        eq(
          schema.contentCalendar.status,
          status.toUpperCase() as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED',
        ),
      );
    }

    return this.db.query.contentCalendar.findMany({
      where: and(...conditions),
      orderBy: desc(schema.contentCalendar.createdAt),
      with: {
        user: { columns: { fullName: true, businessName: true } },
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
  }

  /**
   * Return upcoming (SCHEDULED) posts for the authenticated customer.
   */
  async findUpcomingForUser(userId: string): Promise<ContentCalendarPost[]> {
    return this.db.query.contentCalendar.findMany({
      where: and(
        eq(schema.contentCalendar.userId, userId),
        eq(schema.contentCalendar.status, 'SCHEDULED'),
      ),
      orderBy: desc(schema.contentCalendar.scheduledAt),
      with: {
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
  }

  /**
   * Return published posts for the authenticated customer.
   */
  async findPublishedForUser(userId: string): Promise<ContentCalendarPost[]> {
    return this.db.query.contentCalendar.findMany({
      where: and(
        eq(schema.contentCalendar.userId, userId),
        eq(schema.contentCalendar.status, 'PUBLISHED'),
      ),
      orderBy: desc(schema.contentCalendar.publishedAt),
      with: {
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
  }

  /**
   * Return a single post by id — validates the post belongs to the requesting user.
   */
  async findOneForUser(
    id: string,
    userId: string,
  ): Promise<ContentCalendarPost> {
    const post = await this.db.query.contentCalendar.findFirst({
      where: and(
        eq(schema.contentCalendar.id, id),
        eq(schema.contentCalendar.userId, userId),
      ),
      with: {
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  /**
   * Return a single post by id — for internal service calls (e.g. n8n workflow).
   */
  async findOneById(id: string): Promise<ContentCalendarPost> {
    const post = await this.db.query.contentCalendar.findFirst({
      where: eq(schema.contentCalendar.id, id),
      with: {
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  /**
   * Create a new calendar post for the authenticated customer.
   */
  async createForUser(
    userId: string,
    dto: CreateCalendarPostDto,
  ): Promise<ContentCalendarPost> {
    // Validate platform is connected
    const connected = await this.getConnectedPlatformsForUser(userId);
    if (!connected.includes(dto.platform)) {
      throw new BadRequestException(`Platform ${dto.platform} is not connected.`);
    }

    // Enforce monthly post limits on creation
    if (dto.scheduledAt) {
      await this.checkPostLimit(userId, new Date(dto.scheduledAt));
      await this.checkWeeklyPostLimit(userId, new Date(dto.scheduledAt));
    }

    const [post] = await this.db
      .insert(schema.contentCalendar)
      .values({
        userId,
        title: dto.title,
        caption: dto.caption,
        platform: dto.platform,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        approvalStatus: 'PENDING',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        mediaUrl: dto.mediaUrl ?? null,
        hashtags: dto.hashtags ?? [],
        aiGenerated: dto.aiGenerated ?? false,
      })
      .returning();
    return post;
  }

  /**
   * Update a post for the authenticated customer.
   */
  async updateForUser(
    id: string,
    userId: string,
    dto: UpdateCalendarPostDto,
  ): Promise<ContentCalendarPost> {
    const post = await this.findOneForUser(id, userId);

    if (dto.platform) {
      const connected = await this.getConnectedPlatformsForUser(userId);
      if (!connected.includes(dto.platform)) {
        throw new BadRequestException(`Platform ${dto.platform} is not connected.`);
      }
    }

    // Determine target scheduledAt timestamp if date/time are updated
    let targetScheduledAt: string | null | undefined = dto.scheduledAt;
    if (targetScheduledAt === undefined && (dto.scheduledDate !== undefined || dto.scheduledTime !== undefined)) {
      const datePart = dto.scheduledDate !== undefined
        ? dto.scheduledDate
        : (post.scheduledAt ? new Date(post.scheduledAt).toISOString().split('T')[0] : null);
      if (datePart) {
        const timePart = dto.scheduledTime !== undefined && dto.scheduledTime
          ? dto.scheduledTime
          : (post.scheduledAt ? new Date(post.scheduledAt).toTimeString().substring(0, 5) : '12:00');
        targetScheduledAt = `${datePart}T${timePart}:00`;
      } else {
        targetScheduledAt = null;
      }
    }

    // Enforce monthly and weekly post limits if date is updated
    if (targetScheduledAt) {
      const dateObj = new Date(targetScheduledAt);
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestException(`Invalid scheduled date/time format.`);
      }
      await this.checkPostLimit(userId, dateObj, id);
      await this.checkWeeklyPostLimit(userId, dateObj, id);
    }

    // Validate eligibility if selecting a suggestion
    if (dto.selectedSuggestionId) {
      const suggestion = await this.db.query.contentSuggestions.findFirst({
        where: and(
          eq(schema.contentSuggestions.id, dto.selectedSuggestionId),
          eq(schema.contentSuggestions.userId, userId),
        ),
        with: {
          feedback: true,
        },
      });

      if (!suggestion) {
        throw new NotFoundException('Content suggestion not found.');
      }

      // Check user ratings (1 or 2 stars cannot be selected)
      const userRating = suggestion.feedback?.[0];
      if (userRating && userRating.rating >= 1 && userRating.rating <= 2) {
        throw new BadRequestException(
          'This suggestion is not eligible for posting due to a low rating (1-2 stars).'
        );
      }
    }

    // Topic change regeneration detection: if title is updated, delete suggestions
    if (dto.title && dto.title !== post.title) {
      await this.db
        .delete(schema.contentSuggestions)
        .where(eq(schema.contentSuggestions.postId, id));
    }

    const newScheduledAt = targetScheduledAt !== undefined
      ? (targetScheduledAt ? new Date(targetScheduledAt) : null)
      : post.scheduledAt;

    const newStatus = targetScheduledAt !== undefined
      ? (targetScheduledAt ? 'SCHEDULED' : 'DRAFT')
      : post.status;

    const [updated] = await this.db
      .update(schema.contentCalendar)
      .set({
        title: dto.title !== undefined ? dto.title : post.title,
        caption: dto.caption !== undefined ? dto.caption : post.caption,
        platform: dto.platform !== undefined ? dto.platform : post.platform,
        scheduledAt: newScheduledAt,
        status: newStatus,
        mediaUrl: dto.mediaUrl !== undefined ? dto.mediaUrl : post.mediaUrl,
        hashtags: dto.hashtags !== undefined ? dto.hashtags : post.hashtags,
        selectedSuggestionId: dto.selectedSuggestionId !== undefined
          ? dto.selectedSuggestionId
          : post.selectedSuggestionId,
        aiGenerated: dto.selectedSuggestionId !== undefined
          ? true
          : (dto.aiGenerated !== undefined ? dto.aiGenerated : post.aiGenerated),
        updatedAt: new Date(),
      })
      .where(eq(schema.contentCalendar.id, id))
      .returning();

    // Re-fetch to return fully-populated relations
    return this.findOneForUser(updated.id, userId);
  }

  /**
   * Delete a post — validates ownership before deletion.
   */
  async removeForUser(id: string, userId: string): Promise<{ success: boolean }> {
    const post = await this.findOneForUser(id, userId);
    await this.db
      .delete(schema.contentCalendar)
      .where(eq(schema.contentCalendar.id, post.id));
    return { success: true };
  }

  // ─── Admin endpoints ─────────────────────────────────────────────────────────

  /**
   * Return all posts for a specific user (admin view).
   * Optionally filter by approvalStatus.
   */
  async findAllForAdmin(
    userId?: string,
    approvalStatus?: string,
  ): Promise<ContentCalendarPost[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (userId) {
      conditions.push(eq(schema.contentCalendar.userId, userId));
    }

    if (approvalStatus && approvalStatus !== 'ALL') {
      const valid = ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'];
      if (!valid.includes(approvalStatus.toUpperCase())) {
        throw new BadRequestException(`Invalid approvalStatus: ${approvalStatus}`);
      }
      conditions.push(
        eq(
          schema.contentCalendar.approvalStatus,
          approvalStatus.toUpperCase() as
          | 'PENDING'
          | 'APPROVED'
          | 'REJECTED'
          | 'REVISION_REQUIRED',
        ),
      );
    }

    return this.db.query.contentCalendar.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: desc(schema.contentCalendar.createdAt),
      with: {
        user: { columns: { fullName: true, businessName: true, email: true } },
        suggestions: {
          with: {
            feedback: true,
          },
        },
        selectedSuggestion: true,
      },
    });
  }

  /**
   * List distinct customers who have calendar posts.
   */
  async listCustomers() {
    const posts = await this.db.query.contentCalendar.findMany({
      with: { user: { columns: { id: true, fullName: true, businessName: true, email: true } } },
    });

    // Deduplicate by userId
    const map = new Map<
      string,
      { userId: string; fullName: string; businessName: string | null; email: string; postCount: number; pendingCount: number }
    >();

    for (const post of posts) {
      const u = (post as any).user;
      if (!u) continue;
      const existing = map.get(u.id) ?? {
        userId: u.id,
        fullName: u.fullName,
        businessName: u.businessName,
        email: u.email,
        postCount: 0,
        pendingCount: 0,
      };
      existing.postCount += 1;
      if (post.approvalStatus === 'PENDING') existing.pendingCount += 1;
      map.set(u.id, existing);
    }

    return Array.from(map.values());
  }

  /**
   * Get approval status summary metrics (admin overview).
   */
  async getApprovalOverview(userId?: string) {
    const posts = await this.findAllForAdmin(userId);
    return {
      total: posts.length,
      pending: posts.filter((p) => p.approvalStatus === 'PENDING').length,
      approved: posts.filter((p) => p.approvalStatus === 'APPROVED').length,
      rejected: posts.filter((p) => p.approvalStatus === 'REJECTED').length,
      revisionRequired: posts.filter((p) => p.approvalStatus === 'REVISION_REQUIRED').length,
    };
  }

  /**
   * Update the approval status and optional admin notes on a post.
   */
  async updateApproval(id: string, dto: UpdateApprovalDto): Promise<ContentCalendarPost> {
    const existing = await this.db.query.contentCalendar.findFirst({
      where: eq(schema.contentCalendar.id, id),
    });
    if (!existing) throw new NotFoundException(`Post ${id} not found`);

    const [updated] = await this.db
      .update(schema.contentCalendar)
      .set({
        approvalStatus: dto.approvalStatus,
        adminNotes: dto.adminNotes ?? existing.adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(schema.contentCalendar.id, id))
      .returning();

    return updated;
  }

  // ─── AI Calendar Generation Jobs ─────────────────────────────────────────────

  async createGenerationJob(userId: string, dto: { month: string; platforms: string[] }) {
    // Validate month format (YYYY-MM) and range
    if (!/^\d{4}-\d{2}$/.test(dto.month)) {
      throw new BadRequestException('Month must be in YYYY-MM format.');
    }
    const [yearStr, monthStr] = dto.month.split('-');
    const monthNum = parseInt(monthStr, 10);
    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Month must be between 01 and 12.');
    }

    // Validate platforms
    const validPlatforms = ['Instagram', 'LinkedIn', 'X / Twitter', 'TikTok', 'Facebook'];
    if (!dto.platforms || dto.platforms.length === 0) {
      throw new BadRequestException('At least one platform must be requested.');
    }
    const connectedPlatforms = await this.getConnectedPlatformsForUser(userId);
    for (const p of dto.platforms) {
      if (!validPlatforms.includes(p)) {
        throw new BadRequestException(`Invalid platform requested: ${p}`);
      }
      if (!connectedPlatforms.includes(p)) {
        throw new BadRequestException(`Platform ${p} is not currently connected.`);
      }
    }

    // Enforce Free plan platform limits
    let subscription;
    try {
      subscription = await this.subscriptionsService.findByUserId(userId);
    } catch (err) {
      subscription = { plan: { slug: 'free' } };
    }
    const slug = subscription?.plan?.slug || 'free';
    if (slug === 'free') {
      if (dto.platforms.length > 2) {
        throw new BadRequestException('Free plan only allows up to 2 social channels.');
      }
      if (connectedPlatforms.length > 2) {
        throw new BadRequestException(
          'Free plan only allows up to 2 connected social channels. Please disconnect channels to meet the limit.'
        );
      }
    }

    // Verify limit
    const { limit, currentCount } = await this.getMonthlyLimitAndUsage(userId, new Date(`${dto.month}-01`));
    if (currentCount >= limit) {
      throw new BadRequestException(
        `Monthly post limit reached. Your plan allows a maximum of ${limit} posts per month. You currently have ${currentCount} scheduled/published.`
      );
    }

    // Insert generation job
    const [job] = await this.db
      .insert(schema.calendarGenerationJobs)
      .values({
        userId,
        month: dto.month,
        platforms: dto.platforms,
        status: 'PENDING',
      })
      .returning();

    // Trigger n8n webhook asynchronously
    const webhookUrl = this.configService.get<string>('N8N_CALENDAR_GENERATION_WEBHOOK_URL');
    if (!webhookUrl) {
      await this.db
        .update(schema.calendarGenerationJobs)
        .set({
          status: 'FAILED',
          errorInfo: 'N8N_CALENDAR_GENERATION_WEBHOOK_URL is not configured.',
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarGenerationJobs.id, job.id));
      throw new BadRequestException('AI Calendar generation is temporarily unavailable: webhook not configured.');
    }

    try {
      const response = await global.fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          customerId: userId,
          month: dto.month,
          platforms: dto.platforms,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n returned HTTP status ${response.status}`);
      }

      // Webhook accepted: set status to GENERATING
      const [updatedJob] = await this.db
        .update(schema.calendarGenerationJobs)
        .set({
          status: 'GENERATING',
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarGenerationJobs.id, job.id))
        .returning();

      return updatedJob;
    } catch (err: any) {
      // Set job status to FAILED and store details
      await this.db
        .update(schema.calendarGenerationJobs)
        .set({
          status: 'FAILED',
          errorInfo: `n8n webhook call failed: ${err.message}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarGenerationJobs.id, job.id));

      throw new BadRequestException(`Failed to connect to generation service: ${err.message}`);
    }
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.db.query.calendarGenerationJobs.findFirst({
      where: eq(schema.calendarGenerationJobs.id, jobId),
    });

    if (!job || job.userId !== userId) {
      throw new NotFoundException('Generation job not found.');
    }

    return {
      id: job.id,
      status: job.status,
      month: job.month,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async getGenerationContext(customerId: string) {
    const customer = await this.db.query.users.findFirst({
      where: eq(schema.users.id, customerId),
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const latestJob = await this.db.query.calendarGenerationJobs.findFirst({
      where: eq(schema.calendarGenerationJobs.userId, customerId),
      orderBy: desc(schema.calendarGenerationJobs.createdAt),
    });

    const businessProfile = await this.customerProfileService.getCompanyProfile(customerId);

    return {
      customerId,
      month: latestJob?.month ?? null,
      platforms: latestJob?.platforms ?? [],
      business: {
        name: businessProfile.businessName || '',
        description: businessProfile.businessDescription || null,
        industry: businessProfile.industry || null,
        targetAudience: null,
      },
    };
  }

  async handleN8nResult(jobId: string, dto: { customerId: string; month: string; posts: any[] }) {
    try {
      return await this.saveGeneratedCalendar(jobId, dto);
    } catch (err: any) {
      // Capture saving/validation errors and mark job as FAILED
      await this.db
        .update(schema.calendarGenerationJobs)
        .set({
          status: 'FAILED',
          errorInfo: err.message || 'Unknown error occurred during generation callback.',
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarGenerationJobs.id, jobId));

      throw err;
    }
  }

  private async saveGeneratedCalendar(jobId: string, dto: { customerId: string; month: string; posts: any[] }) {
    const job = await this.db.query.calendarGenerationJobs.findFirst({
      where: eq(schema.calendarGenerationJobs.id, jobId),
    });

    if (!job) {
      throw new NotFoundException('Generation job not found.');
    }

    if (job.userId !== dto.customerId) {
      throw new BadRequestException('Job customer ID mismatch.');
    }

    if (job.status === 'GENERATED') {
      return { success: true, message: 'Job already processed.' };
    }

    if (job.month !== dto.month) {
      throw new BadRequestException(`Month mismatch. Job requested ${job.month}, but payload has ${dto.month}.`);
    }

    // Limit checks
    const { limit, currentCount } = await this.getMonthlyLimitAndUsage(job.userId, new Date(`${job.month}-01`));
    const newPostsCount = dto.posts.length;

    if (currentCount + newPostsCount > limit) {
      throw new BadRequestException(
        `Saving these posts would exceed your monthly limit of ${limit} posts. Current posts: ${currentCount}, attempted to add: ${newPostsCount}.`
      );
    }

    const connectedPlatforms = await this.getConnectedPlatformsForUser(job.userId);
    let subscription;
    try {
      subscription = await this.subscriptionsService.findByUserId(job.userId);
    } catch (err) {
      subscription = { plan: { slug: 'free' } };
    }
    const slug = subscription?.plan?.slug || 'free';

    // Parse the requested month
    const [yearStr, monthStr] = job.month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0); // last day of month

    const firstWeekStart = this.getWeekRange(firstDay).start;
    const lastWeekEnd = this.getWeekRange(lastDay).end;

    // Get the weekly limit based on the plan
    const isFree = slug === 'free';
    const weeklyLimit = isFree ? 2 : Infinity;

    return await this.db.transaction(async (tx) => {
      // Fetch all existing scheduled posts for this user in overlapping weeks, inside the transaction
      const existingPostsInOverlap = await tx.query.contentCalendar.findMany({
        where: (fields, { and, eq, gte, lte }) =>
          and(
            eq(fields.userId, job.userId),
            gte(fields.scheduledAt, firstWeekStart),
            lte(fields.scheduledAt, lastWeekEnd),
          ),
      });

      // Group existing posts by week key (week start timestamp)
      const existingCountsByWeek = new Map<number, number>();
      const existingPostsByDay = new Map<number, number>(); // day timestamp -> count of posts

      for (const post of existingPostsInOverlap) {
        if (post.scheduledAt) {
          const weekStart = this.getWeekRange(post.scheduledAt).start.getTime();
          existingCountsByWeek.set(weekStart, (existingCountsByWeek.get(weekStart) || 0) + 1);

          const dayStart = new Date(post.scheduledAt);
          dayStart.setHours(0, 0, 0, 0);
          existingPostsByDay.set(dayStart.getTime(), (existingPostsByDay.get(dayStart.getTime()) || 0) + 1);
        }
      }

      // Build the list of weeks overlapping the month
      interface WeekData {
        start: Date;
        end: Date;
        daysInMonth: Date[];
        existingCount: number;
        assigned: any[];
        capacity: number;
      }

      const weeks: WeekData[] = [];
      let currentWeekStart = new Date(firstWeekStart);

      while (currentWeekStart <= lastDay) {
        const start = new Date(currentWeekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const daysInMonth: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(start);
          day.setDate(start.getDate() + i);
          if (day.getMonth() === monthIndex && day.getFullYear() === year) {
            daysInMonth.push(day);
          }
        }

        const existingCount = existingCountsByWeek.get(start.getTime()) || 0;
        const capacity = weeklyLimit - existingCount;

        weeks.push({
          start,
          end,
          daysInMonth,
          existingCount,
          assigned: [],
          capacity,
        });

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      // Check if requested posts exceed what can fit under the weekly limit
      let totalCapacity = 0;
      for (const w of weeks) {
        if (w.daysInMonth.length > 0 && w.capacity > 0) {
          totalCapacity += w.capacity;
        }
      }

      if (isFree && dto.posts.length > totalCapacity) {
        throw new BadRequestException(
          `Saving these posts would exceed the weekly limit of ${weeklyLimit} posts. Available slots: ${totalCapacity}, attempted to add: ${dto.posts.length}.`
        );
      }

      // For each new post, find the best week to assign it
      for (const post of dto.posts) {
        let bestWeek: WeekData | null = null;
        let minTotalPosts = Infinity;

        for (const w of weeks) {
          if (w.daysInMonth.length === 0) continue;
          if (w.assigned.length >= w.capacity) continue;

          const totalPosts = w.existingCount + w.assigned.length;
          if (totalPosts < minTotalPosts) {
            minTotalPosts = totalPosts;
            bestWeek = w;
          }
        }

        if (!bestWeek) {
          throw new BadRequestException(
            'Could not find a valid week to schedule all generated posts under the weekly limit constraint.'
          );
        }

        bestWeek.assigned.push(post);
      }

      // Distribute assigned posts to specific days in each week
      const dayCounts = new Map<number, number>();
      for (const [dayTime, count] of existingPostsByDay.entries()) {
        dayCounts.set(dayTime, count);
      }

      const scheduledPosts: any[] = [];

      for (const w of weeks) {
        const k = w.assigned.length;
        if (k === 0) continue;

        const Dw = w.daysInMonth.length;

        for (let i = 0; i < k; i++) {
          const post = w.assigned[i];
          const prefIndex = Math.floor((i + 0.5) * Dw / k);

          let bestDay: Date | null = null;
          let minDayCount = Infinity;
          let minDistance = Infinity;

          for (let j = 0; j < Dw; j++) {
            const day = w.daysInMonth[j];
            const dayTime = day.getTime();
            const dayCount = dayCounts.get(dayTime) || 0;

            if (dayCount < minDayCount) {
              minDayCount = dayCount;
              bestDay = day;
              minDistance = Math.abs(j - prefIndex);
            } else if (dayCount === minDayCount) {
              const distance = Math.abs(j - prefIndex);
              if (distance < minDistance) {
                minDistance = distance;
                bestDay = day;
              }
            }
          }

          if (!bestDay) {
            bestDay = w.daysInMonth[0];
          }

          const bestDayTime = bestDay.getTime();
          dayCounts.set(bestDayTime, (dayCounts.get(bestDayTime) || 0) + 1);

          const yearVal = bestDay.getFullYear();
          const monthVal = String(bestDay.getMonth() + 1).padStart(2, '0');
          const dateVal = String(bestDay.getDate()).padStart(2, '0');

          scheduledPosts.push({
            ...post,
            scheduledDate: `${yearVal}-${monthVal}-${dateVal}`,
          });
        }
      }

      const savedPostIds: string[] = [];

      for (const post of scheduledPosts) {
        const validPlatforms = ['Instagram', 'LinkedIn', 'X / Twitter', 'TikTok', 'Facebook'];
        if (!validPlatforms.includes(post.platform)) {
          throw new BadRequestException(`Invalid platform: ${post.platform}`);
        }
        if (!job.platforms.includes(post.platform)) {
          throw new BadRequestException(`Platform ${post.platform} was not requested in this generation job.`);
        }
        if (!connectedPlatforms.includes(post.platform)) {
          throw new BadRequestException(`Platform ${post.platform} is not currently connected.`);
        }

        if (!post.scheduledDate.startsWith(job.month)) {
          throw new BadRequestException(`Scheduled date ${post.scheduledDate} does not belong to the requested month ${job.month}.`);
        }

        const scheduledAt = new Date(`${post.scheduledDate}T${post.scheduledTime}:00`);
        if (isNaN(scheduledAt.getTime())) {
          throw new BadRequestException(`Invalid scheduled date/time: ${post.scheduledDate} ${post.scheduledTime}`);
        }

        const [inserted] = await tx
          .insert(schema.contentCalendar)
          .values({
            userId: job.userId,
            title: post.title,
            caption: post.caption,
            platform: post.platform as any,
            status: 'SCHEDULED',
            approvalStatus: 'PENDING',
            scheduledAt,
            hashtags: post.hashtags ?? [],
            aiGenerated: true,
          })
          .returning();

        savedPostIds.push(inserted.id);
      }

      await tx
        .update(schema.calendarGenerationJobs)
        .set({
          status: 'GENERATED',
          resultIds: savedPostIds,
          updatedAt: new Date(),
        })
        .where(eq(schema.calendarGenerationJobs.id, job.id));

      return {
        success: true,
        count: savedPostIds.length,
        postIds: savedPostIds,
      };
    });
  }

  async getMonthlyLimitAndUsage(userId: string, targetDate: Date) {
    let limit = 8;
    let slug = 'free';
    let subscription;
    try {
      subscription = await this.subscriptionsService.findByUserId(userId);
    } catch (err) {
      subscription = null;
    }

    if (subscription?.plan) {
      const slugMap: Record<string, number> = {
        free: 8,
        starter: 30,
        growth: 150,
        'brand-domination': 300,
      };
      limit = typeof subscription.plan.monthlyPostLimit === 'number' 
        ? subscription.plan.monthlyPostLimit 
        : (slugMap[subscription.plan.slug || 'free'] || 8);
      slug = subscription.plan.slug || 'free';
    } else {
      limit = 8;
      slug = 'free';
      if (this.db.query.plans) {
        const freePlan = await this.db.query.plans.findFirst({
          where: eq(schema.plans.slug, 'free'),
        });
        if (freePlan && typeof freePlan.monthlyPostLimit === 'number') {
          limit = freePlan.monthlyPostLimit;
          slug = freePlan.slug;
        }
      }
    }

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const posts = await this.db.query.contentCalendar.findMany({
      where: (fields, { and, eq, gte, lte }) =>
        and(
          eq(fields.userId, userId),
          gte(fields.scheduledAt, startOfMonth),
          lte(fields.scheduledAt, endOfMonth),
        ),
    });

    return {
      slug,
      limit,
      currentCount: posts.length,
    };
  }

  async getUsageForUser(userId: string, monthStr?: string) {
    let targetDate = new Date();
    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split('-').map(v => parseInt(v, 10));
      targetDate = new Date(year, month - 1, 1);
    }

    const { slug, limit, currentCount } = await this.getMonthlyLimitAndUsage(userId, targetDate);

    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      month: monthKey,
      plan: slug,
      monthlyLimit: limit,
      monthlyUsed: currentCount,
      monthlyRemaining: Math.max(0, limit - currentCount),
      weeklyLimit: slug === 'free' ? 2 : Infinity,
    };
  }
}
