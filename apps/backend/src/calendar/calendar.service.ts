import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { ContentCalendarPost } from '../database/schema/content-calendar.schema';

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

/** Shape of the body when updating approval status (admin only). */
export interface UpdateApprovalDto {
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
  adminNotes?: string;
}

@Injectable()
export class CalendarService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

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
      with: { user: { columns: { fullName: true, businessName: true } } },
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
      with: { user: { columns: { fullName: true, businessName: true, email: true } } },
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
}
