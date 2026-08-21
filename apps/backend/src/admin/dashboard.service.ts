import { Inject, Injectable } from '@nestjs/common';
import { count, eq, gte, lt, and, sum, sql, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UserRole } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;

export type DashboardUserGroup = 'free' | 'paid';

type CustomerPlanRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  planSlug: string;
  isPaid: boolean;
  status: string;
  joinedDate: Date | null;
};

@Injectable()
export class DashboardService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) { }

  /**
   * Free = current Plan slug is `free`, or the customer has no active subscription.
   * Paid = current active Plan slug is anything other than `free`.
   */
  private isPaidPlan(slug: string | null | undefined): boolean {
    return Boolean(slug) && slug !== 'free';
  }

  private mapCustomerRow(row: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    joinedDate: Date | null;
    planName: string | null;
    planSlug: string | null;
  }): CustomerPlanRow {
    const planSlug = row.planSlug || 'free';
    const isPaid = this.isPaidPlan(planSlug);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      plan: row.planName || 'Free',
      planSlug,
      isPaid,
      status: row.isActive ? 'Active' : 'Suspended',
      joinedDate: row.joinedDate,
    };
  }

  /**
   * Customers (role = user) with the Plan they are currently on
   * (active subscription → plans). No HTTP/in-memory cache.
   */
  private async getCustomerPlanRows(): Promise<CustomerPlanRow[]> {
    const customers = await this.db
      .select({
        id: schema.users.id,
        name: schema.users.fullName,
        email: schema.users.email,
        isActive: schema.users.isActive,
        joinedDate: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.role, UserRole.USER));

    const activeSubs = await this.db
      .select({
        userId: schema.subscriptions.userId,
        planName: schema.plans.name,
        planSlug: schema.plans.slug,
        createdAt: schema.subscriptions.createdAt,
      })
      .from(schema.subscriptions)
      .innerJoin(schema.plans, eq(schema.subscriptions.planId, schema.plans.id))
      .where(eq(schema.subscriptions.status, 'active'))
      .orderBy(desc(schema.subscriptions.createdAt));

    const planByUser = new Map<string, { planName: string; planSlug: string }>();
    for (const sub of activeSubs) {
      if (!planByUser.has(sub.userId)) {
        planByUser.set(sub.userId, { planName: sub.planName, planSlug: sub.planSlug });
      }
    }

    return customers.map((c) => {
      const plan = planByUser.get(c.id);
      return this.mapCustomerRow({
        ...c,
        planName: plan?.planName ?? null,
        planSlug: plan?.planSlug ?? null,
      });
    });
  }

  async getUsersByGroup(group: DashboardUserGroup) {
    const rows = await this.getCustomerPlanRows();
    const filtered = rows.filter((row) => (group === 'paid' ? row.isPaid : !row.isPaid));
    return {
      group,
      count: filtered.length,
      users: filtered,
    };
  }

  async getSummary(period: string = 'weekly') {
    const { now, startDate, prevStartDate } = this.getPeriodWindow(period);
    const customerRows = await this.getCustomerPlanRows();
    const freeUsers = customerRows.filter((row) => !row.isPaid);
    const paidUsers = customerRows.filter((row) => row.isPaid);

    const customerCondition = eq(schema.users.role, UserRole.USER);

    const [
      newCustomersRes,
      prevNewCustomersRes,
      expiredSubsRes,
      publishedThisRes,
      publishedPrevRes,
      connectedThisRes,
      connectedPrevRes,
      connectedAllRes,
      aiThisRes,
      aiPrevRes,
      aiAllRes,
      revenueRes,
      prevRevenueRes,
      publishingCounts,
      publishingTrendRows,
      revenueTrendRows,
      recentActivity,
      recentPosts,
    ] = await Promise.all([
      this.db
        .select({ val: count() })
        .from(schema.users)
        .where(and(customerCondition, gte(schema.users.createdAt, startDate))),
      this.db
        .select({ val: count() })
        .from(schema.users)
        .where(
          and(
            customerCondition,
            gte(schema.users.createdAt, prevStartDate),
            lt(schema.users.createdAt, startDate),
          ),
        ),
      this.db
        .select({ val: count() })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.status, 'expired')),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.contentCalendar)
          .where(
            and(
              eq(schema.contentCalendar.status, 'PUBLISHED'),
              gte(schema.contentCalendar.updatedAt, startDate),
            ),
          ),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.contentCalendar)
          .where(
            and(
              eq(schema.contentCalendar.status, 'PUBLISHED'),
              gte(schema.contentCalendar.updatedAt, prevStartDate),
              lt(schema.contentCalendar.updatedAt, startDate),
            ),
          ),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.social_accounts)
          .where(
            and(
              eq(schema.social_accounts.status, 'connected'),
              gte(schema.social_accounts.connectedAt, startDate),
            ),
          ),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.social_accounts)
          .where(
            and(
              eq(schema.social_accounts.status, 'connected'),
              gte(schema.social_accounts.connectedAt, prevStartDate),
              lt(schema.social_accounts.connectedAt, startDate),
            ),
          ),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.social_accounts)
          .where(eq(schema.social_accounts.status, 'connected')),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.contentSuggestions)
          .where(gte(schema.contentSuggestions.createdAt, startDate)),
      ),
      this.safeCount(
        this.db
          .select({ val: count() })
          .from(schema.contentSuggestions)
          .where(
            and(
              gte(schema.contentSuggestions.createdAt, prevStartDate),
              lt(schema.contentSuggestions.createdAt, startDate),
            ),
          ),
      ),
      this.safeCount(this.db.select({ val: count() }).from(schema.contentSuggestions)),
      this.db
        .select({ val: sum(schema.payments.amount) })
        .from(schema.payments)
        .where(
          and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
        ),
      this.db
        .select({ val: sum(schema.payments.amount) })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, 'successful'),
            gte(schema.payments.createdAt, prevStartDate),
            lt(schema.payments.createdAt, startDate),
          ),
        ),
      this.db
        .select({
          status: schema.scheduledPosts.status,
          val: count(),
        })
        .from(schema.scheduledPosts)
        .where(gte(schema.scheduledPosts.createdAt, startDate))
        .groupBy(schema.scheduledPosts.status),
      this.db
        .select({
          day: sql<string>`to_char(${schema.scheduledPosts.scheduledAt}, 'YYYY-MM-DD')`,
          status: schema.scheduledPosts.status,
          val: count(),
        })
        .from(schema.scheduledPosts)
        .where(gte(schema.scheduledPosts.scheduledAt, startDate))
        .groupBy(
          sql`to_char(${schema.scheduledPosts.scheduledAt}, 'YYYY-MM-DD')`,
          schema.scheduledPosts.status,
        ),
      this.db
        .select({
          day: sql<string>`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`,
          total: sum(schema.payments.amount),
        })
        .from(schema.payments)
        .where(
          and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
        )
        .groupBy(sql`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`),
      this.db
        .select({
          id: schema.activityLogs.id,
          action: schema.activityLogs.action,
          module: schema.activityLogs.module,
          description: schema.activityLogs.description,
          userName: schema.activityLogs.userName,
          createdAt: schema.activityLogs.createdAt,
        })
        .from(schema.activityLogs)
        .orderBy(desc(schema.activityLogs.createdAt))
        .limit(8),
      this.db
        .select({
          id: schema.publishingLogs.id,
          status: schema.publishingLogs.status,
          error: schema.publishingLogs.error,
          attemptedAt: schema.publishingLogs.attemptedAt,
          platform: schema.scheduledPosts.platform,
          content: schema.scheduledPosts.content,
        })
        .from(schema.publishingLogs)
        .leftJoin(
          schema.scheduledPosts,
          eq(schema.publishingLogs.scheduledPostId, schema.scheduledPosts.scheduledPostId),
        )
        .orderBy(desc(schema.publishingLogs.attemptedAt))
        .limit(8),
    ]);

    const newCustomersThisPeriod = newCustomersRes[0]?.val || 0;
    const publishedPosts = publishedThisRes;
    const connectedAccounts = connectedAllRes;
    const aiContentGenerated = aiAllRes;

    const pubMap: Record<string, number> = {};
    for (const row of publishingCounts) {
      pubMap[row.status] = Number(row.val);
    }

    const publishing = {
      scheduled: pubMap['SCHEDULED'] || 0,
      published: pubMap['PUBLISHED'] || 0,
      failed: pubMap['FAILED'] || 0,
      pending: pubMap['PROCESSING'] || 0,
    };

    const dayLabels = this.eachDayIso(startDate, now);
    const publishedByDay = new Map<string, number>();
    const scheduledByDay = new Map<string, number>();
    for (const row of publishingTrendRows) {
      const n = Number(row.val);
      if (row.status === 'PUBLISHED') {
        publishedByDay.set(row.day, n);
      } else if (row.status === 'SCHEDULED' || row.status === 'PROCESSING') {
        scheduledByDay.set(row.day, (scheduledByDay.get(row.day) || 0) + n);
      }
    }

    const publishingTrend = dayLabels.map((label) => ({
      label,
      published: publishedByDay.get(label) || 0,
      scheduled: scheduledByDay.get(label) || 0,
    }));

    const revenueByDay = new Map(
      revenueTrendRows.map((row) => [row.day, Number(row.total || 0) / 100]),
    );
    const revenueTrend = dayLabels.map((label) => ({
      label,
      amount: revenueByDay.get(label) || 0,
    }));

    const revenueThisPeriod = Number(revenueRes[0]?.val || 0) / 100;
    const revenuePrevPeriod = Number(prevRevenueRes[0]?.val || 0) / 100;

    const serializeUser = (row: CustomerPlanRow) => ({
      ...row,
      joinedDate: row.joinedDate,
    });

    return {
      totalCustomers: customerRows.length,
      customerGrowthPercent: this.calculateGrowthPercent(
        newCustomersThisPeriod,
        prevNewCustomersRes[0]?.val || 0,
      ),
      newCustomersThisPeriod,
      registrationsGrowthPercent: this.calculateGrowthPercent(
        newCustomersThisPeriod,
        prevNewCustomersRes[0]?.val || 0,
      ),
      freeUsers: freeUsers.length,
      paidUsers: paidUsers.length,
      expiredSubscriptions: expiredSubsRes[0]?.val || 0,
      publishedPosts,
      publishedPostsGrowthPercent: this.calculateGrowthPercent(publishedThisRes, publishedPrevRes),
      connectedAccounts,
      connectedAccountsGrowthPercent: this.calculateGrowthPercent(
        connectedThisRes,
        connectedPrevRes,
      ),
      aiContentGenerated,
      aiContentThisPeriod: aiThisRes,
      aiContentGrowthPercent: this.calculateGrowthPercent(aiThisRes, aiPrevRes),
      publishing,
      publishingTrend,
      revenueThisPeriod,
      revenueGrowthPercent: this.calculateGrowthPercent(revenueThisPeriod, revenuePrevPeriod),
      revenueTrend,
      recentActivity,
      recentPosts,
      freeUsersPreview: freeUsers.slice(0, 8).map(serializeUser),
      paidUsersPreview: paidUsers.slice(0, 8).map(serializeUser),
    };
  }

  /**
   * Resolves the current period window plus the immediately preceding
   * window of equal length, so growth percentages can be computed.
   */
  private getPeriodWindow(period: string) {
    const now = new Date();
    let days = 7;
    if (period === 'daily') {
      days = 1;
    } else if (period === 'monthly') {
      days = 30;
    }

    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - days);

    return { now, startDate, prevStartDate };
  }

  private calculateGrowthPercent(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private eachDayIso(start: Date, end: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (cursor <= last) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  private async safeCount(query: Promise<{ val: number }[]>): Promise<number> {
    try {
      const [res] = await query;
      return Number(res?.val || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Real-data analytics summary for the Admin Analytics page.
   * Only returns metrics backed by actual tables (users, subscriptions,
   * plans, payments). Engagement/AI-usage/social-performance/content
   * metrics are intentionally NOT computed here — there is no schema
   * for that data yet, so the frontend marks those widgets "Coming Soon".
   */
  async getAnalyticsSummary(period: string = 'weekly') {
    const { startDate, prevStartDate } = this.getPeriodWindow(period);

    // Total customers (all-time)
    const [totalCustomersRes] = await this.db.select({ val: count() }).from(schema.users);

    // New customers - current period vs previous period
    const [newCustomersRes] = await this.db
      .select({ val: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, startDate));

    const [prevNewCustomersRes] = await this.db
      .select({ val: count() })
      .from(schema.users)
      .where(
        and(gte(schema.users.createdAt, prevStartDate), lt(schema.users.createdAt, startDate)),
      );

    // Active / expired subscriptions (all-time snapshot)
    const [activeSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));

    const [expiredSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'expired'));

    // Revenue - current period vs previous period
    const [revenueRes] = await this.db
      .select({ val: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(
        and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
      );

    const [prevRevenueRes] = await this.db
      .select({ val: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.status, 'successful'),
          gte(schema.payments.createdAt, prevStartDate),
          lt(schema.payments.createdAt, startDate),
        ),
      );

    const revenueThisPeriod = Number(revenueRes?.val || 0) / 100;
    const revenuePrevPeriod = Number(prevRevenueRes?.val || 0) / 100;

    // Revenue trend - real daily totals within the current period
    const trendRows = await this.db
      .select({
        day: sql<string>`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`,
        total: sum(schema.payments.amount),
      })
      .from(schema.payments)
      .where(
        and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
      )
      .groupBy(sql`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${schema.payments.createdAt}, 'YYYY-MM-DD')`);

    const revenueTrend = trendRows.map((row) => ({
      label: row.day,
      amount: Number(row.total || 0) / 100,
    }));

    // Plan distribution - active subscriptions grouped by plan (real data)
    const planRows = await this.db
      .select({ planName: schema.plans.name, val: count() })
      .from(schema.subscriptions)
      .innerJoin(schema.plans, eq(schema.subscriptions.planId, schema.plans.id))
      .where(eq(schema.subscriptions.status, 'active'))
      .groupBy(schema.plans.name);

    const totalActivePlanSubs = planRows.reduce((total, row) => total + Number(row.val), 0);
    const planDistribution = planRows.map((row) => ({
      planName: row.planName,
      count: Number(row.val),
      percent:
        totalActivePlanSubs > 0 ? Math.round((Number(row.val) / totalActivePlanSubs) * 1000) / 10 : 0,
    }));

    return {
      totalCustomers: totalCustomersRes?.val || 0,
      newCustomersThisPeriod: newCustomersRes?.val || 0,
      customerGrowthPercent: this.calculateGrowthPercent(
        newCustomersRes?.val || 0,
        prevNewCustomersRes?.val || 0,
      ),
      activeSubscriptions: activeSubsRes?.val || 0,
      expiredSubscriptions: expiredSubsRes?.val || 0,
      revenueThisPeriod,
      revenueGrowthPercent: this.calculateGrowthPercent(revenueThisPeriod, revenuePrevPeriod),
      revenueTrend,
      planDistribution,
    };
  }
}