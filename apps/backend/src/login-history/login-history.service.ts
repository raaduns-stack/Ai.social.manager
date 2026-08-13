import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and, eq, gte, lte, ilike, desc, count, isNull, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { LoginStatus } from '../common/enums/login-status.enum';
import { LoginFailureReason } from '../common/enums/login-failure-reason.enum';
import { QueryLoginHistoryDto } from './dto/query-login-history.dto';

type Database = PostgresJsDatabase<typeof schema>;

export interface CreateLoginHistoryPayload {
  userId?: string | null;
  email: string;
  status: LoginStatus;
  failureReason?: LoginFailureReason | null;
  ipAddress?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  userAgentRaw?: string | null;
  browser?: string | null;
  os?: string | null;
  device?: string | null;
  isSuspicious?: boolean;
}

@Injectable()
export class LoginHistoryService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  /**
   * Records a single login attempt.
   * Called by AuthService after every login attempt (success or failure).
   * Errors are swallowed — recording must never break the auth flow.
   */
  async record(payload: CreateLoginHistoryPayload): Promise<void> {
    try {
      await this.db.insert(schema.loginHistory).values({
        userId: payload.userId ?? null,
        email: payload.email,
        status: payload.status,
        failureReason: payload.failureReason ?? null,
        ipAddress: payload.ipAddress ?? null,
        country: payload.country ?? null,
        city: payload.city ?? null,
        region: payload.region ?? null,
        userAgentRaw: payload.userAgentRaw ?? null,
        browser: payload.browser ?? null,
        os: payload.os ?? null,
        device: payload.device ?? null,
        isSuspicious: payload.isSuspicious ?? false,
      });
    } catch (err) {
      // Log but never throw — audit failures must not block authentication.
      console.error('[LoginHistoryService] Failed to record login attempt:', err);
    }
  }

  /**
   * Paginated admin query with optional filters.
   * Returns login history rows joined with user data (name, email)
   * when the user still exists, otherwise returns null for user fields.
   */
  async findAll(query: QueryLoginHistoryDto) {
    const { status, userId, email, from, to, ipAddress, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      status ? eq(schema.loginHistory.status, status) : undefined,
      userId ? eq(schema.loginHistory.userId, userId) : undefined,
      email ? ilike(schema.loginHistory.email, `%${email}%`) : undefined,
      from ? gte(schema.loginHistory.createdAt, new Date(from)) : undefined,
      to ? lte(schema.loginHistory.createdAt, new Date(to)) : undefined,
      ipAddress ? eq(schema.loginHistory.ipAddress, ipAddress) : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Run the data query and total count in parallel
    const [rows, totalResult] = await Promise.all([
      this.db
        .select({
          // Login history fields
          id: schema.loginHistory.id,
          email: schema.loginHistory.email,
          status: schema.loginHistory.status,
          failureReason: schema.loginHistory.failureReason,
          ipAddress: schema.loginHistory.ipAddress,
          country: schema.loginHistory.country,
          city: schema.loginHistory.city,
          region: schema.loginHistory.region,
          browser: schema.loginHistory.browser,
          os: schema.loginHistory.os,
          device: schema.loginHistory.device,
          isSuspicious: schema.loginHistory.isSuspicious,
          createdAt: schema.loginHistory.createdAt,
          // User fields (null when user was deleted)
          userId: schema.loginHistory.userId,
          userName: schema.users.fullName,
          userEmail: schema.users.email,
          userRole: schema.users.role,
        })
        .from(schema.loginHistory)
        .leftJoin(schema.users, eq(schema.loginHistory.userId, schema.users.id))
        .where(whereClause)
        .orderBy(desc(schema.loginHistory.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(schema.loginHistory)
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

  /**
   * Returns all login attempts for a specific user, newest first.
   * Used by the admin view of a single user's login history.
   */
  async findByUser(userId: string) {
    return this.db
      .select()
      .from(schema.loginHistory)
      .where(eq(schema.loginHistory.userId, userId))
      .orderBy(desc(schema.loginHistory.createdAt));
  }
}
