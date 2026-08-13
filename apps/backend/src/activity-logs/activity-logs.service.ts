import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, count, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

type Database = PostgresJsDatabase<typeof schema>;

export interface CreateActivityLogPayload {
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  description: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  /**
   * Records a single activity log entry.
   * Errors are swallowed — recording must never break the calling flow.
   */
  async record(payload: CreateActivityLogPayload): Promise<void> {
    try {
      await this.db.insert(schema.activityLogs).values({
        userId: payload.userId ?? null,
        userName: payload.userName ?? null,
        action: payload.action,
        module: payload.module,
        description: payload.description,
      });
    } catch (err) {
      console.error('[ActivityLogsService] Failed to record activity log:', err);
    }
  }

  /**
   * Paginated admin query with optional module filter.
   * Returns activity log rows joined with user data (role)
   * when the user still exists, otherwise returns null for user fields.
   * Results are newest-first.
   */
  async findAll(query: QueryActivityLogsDto) {
    const { module, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      module ? eq(schema.activityLogs.module, module) : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select({
          id: schema.activityLogs.id,
          userId: schema.activityLogs.userId,
          userName: schema.activityLogs.userName,
          action: schema.activityLogs.action,
          module: schema.activityLogs.module,
          description: schema.activityLogs.description,
          createdAt: schema.activityLogs.createdAt,
          // Live user role (null when user deleted)
          userRole: schema.users.role,
        })
        .from(schema.activityLogs)
        .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
        .where(whereClause)
        .orderBy(desc(schema.activityLogs.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(schema.activityLogs)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }
}
