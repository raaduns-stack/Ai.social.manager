import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { ScheduledNotificationStatus } from '../common/enums';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class ScheduledNotificationsService {
  private readonly logger = new Logger(ScheduledNotificationsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async create(data: {
    userId: string;
    createdById?: string;
    type: string;
    channel: string;
    priority?: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    scheduledFor: Date;
    repeatInterval?: string;
    repeatUntil?: Date;
    maxAttempts?: number;
  }) {
    const [record] = await this.db.insert(schema.scheduledNotifications).values({
      userId: data.userId,
      createdById: data.createdById,
      type: data.type as any,
      channel: data.channel as any,
      priority: (data.priority || 'NORMAL') as any,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      scheduledFor: data.scheduledFor,
      repeatInterval: data.repeatInterval,
      repeatUntil: data.repeatUntil,
      maxAttempts: data.maxAttempts || 3,
    } as any).returning();

    return record;
  }

  async findById(id: string) {
    const record = await this.db.query.scheduledNotifications.findFirst({
      where: eq(schema.scheduledNotifications.id, id),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    return record || null;
  }

  async findDue(limit = 100) {
    return this.db.query.scheduledNotifications.findMany({
      where: and(
        eq(schema.scheduledNotifications.status, ScheduledNotificationStatus.PENDING as any),
        sql`${schema.scheduledNotifications.scheduledFor} <= now()`,
      ),
      limit,
      orderBy: [schema.scheduledNotifications.scheduledFor],
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters: { userId?: string; status?: string; limit?: number; offset?: number } = {}) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(schema.scheduledNotifications.userId, filters.userId));
    if (filters.status) conditions.push(eq(schema.scheduledNotifications.status, filters.status as any));

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const records = await this.db.query.scheduledNotifications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.scheduledNotifications.createdAt)],
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    return records;
  }

  async markDispatched(id: string) {
    const [updated] = await this.db
      .update(schema.scheduledNotifications)
      .set({
        status: ScheduledNotificationStatus.DISPATCHED as any,
        lastAttemptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.scheduledNotifications.id, id))
      .returning();

    return updated;
  }

  async markFailed(id: string) {
    const existing = await this.db.query.scheduledNotifications.findFirst({
      where: eq(schema.scheduledNotifications.id, id),
    });

    if (!existing) return null;

    const attempts = existing.attempts + 1;
    const shouldFail = attempts >= existing.maxAttempts;

    const [updated] = await this.db
      .update(schema.scheduledNotifications)
      .set({
        status: (shouldFail ? ScheduledNotificationStatus.FAILED : ScheduledNotificationStatus.PENDING) as any,
        lastAttemptedAt: new Date(),
        attempts: attempts,
        updatedAt: new Date(),
      })
      .where(eq(schema.scheduledNotifications.id, id))
      .returning();

    return updated;
  }

  async cancel(id: string) {
    const [updated] = await this.db
      .update(schema.scheduledNotifications)
      .set({
        status: ScheduledNotificationStatus.CANCELLED as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.scheduledNotifications.id, id))
      .returning();

    return updated;
  }

  async count(filters: { userId?: string; status?: string } = {}) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(schema.scheduledNotifications.userId, filters.userId));
    if (filters.status) conditions.push(eq(schema.scheduledNotifications.status, filters.status as any));

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.scheduledNotifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(result[0]?.count || 0);
  }
}
