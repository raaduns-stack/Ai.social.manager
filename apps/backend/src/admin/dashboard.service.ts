import { Inject, Injectable } from '@nestjs/common';
import { count, eq, gte, lt, and, sum, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DashboardService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) { }

  async getSummary(period: string = 'weekly') {
    const now = new Date();
    const startDate = new Date();

    if (period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'monthly') {
      startDate.setDate(now.getDate() - 30);
    } else {
      // Default to weekly (7 days)
      startDate.setDate(now.getDate() - 7);
    }

    // 1. Total Customers (total rows in users)
    const [totalCustomersRes] = await this.db.select({ val: count() }).from(schema.users);

    // 2. New Customers This Period
    const [newCustomersRes] = await this.db
      .select({ val: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, startDate));

    // 3. Active Subscriptions
    const [activeSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));

    // 4. Expired Subscriptions
    const [expiredSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'expired'));

    // 5. Revenue This Period (sum of successful payments converted from kobo to naira)
    const [revenueRes] = await this.db
      .select({ val: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(
        and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
      );

    const revenueKobo = Number(revenueRes?.val || 0);
    const revenueNaira = revenueKobo / 100;

    return {
      totalCustomers: totalCustomersRes?.val || 0,
      newCustomersThisPeriod: newCustomersRes?.val || 0,
      activeSubscriptions: activeSubsRes?.val || 0,
      expiredSubscriptions: expiredSubsRes?.val || 0,
      revenueThisPeriod: revenueNaira,
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