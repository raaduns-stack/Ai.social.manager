import { Inject, Injectable } from '@nestjs/common';
import { count, eq, gte, lte, and, sum, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

export type AnalyticsPeriod = 'day' | 'week' | 'month';

interface PeriodWindow {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) { }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public entry point — assembles the full analytics response in one call.
  // All sub-queries run concurrently via Promise.all to minimise latency.
  // ─────────────────────────────────────────────────────────────────────────────
  async getAnalytics(period: AnalyticsPeriod = 'month') {
    const window = this.buildPeriodWindow(period);

    const [
      customerGrowth,
      revenueGrowth,
      revenueTimeSeries,
      socialPerformance,
      planDistribution,
    ] = await Promise.all([
      this.getCustomerGrowthKpi(window),
      this.getRevenueKpi(window),
      this.getRevenueTimeSeries(period, window),
      this.getSocialPerformance(),
      this.getPlanDistribution(),
    ]);

    return {
      period,
      generatedAt: new Date().toISOString(),

      // ── Section 1: KPI Stat Cards ──────────────────────────────────────────
      kpis: {
        customerGrowth,
        revenueGrowth,
        // No engagement_metrics table exists yet
        engagementRate: { dataAvailable: false },
        // No ai_generations table exists yet
        aiUsage: { dataAvailable: false },
      },

      // ── Section 2: Revenue Analytics Bar Chart ─────────────────────────────
      revenueTimeSeries,

      // ── Section 3: Social Media Performance Chart ──────────────────────────
      socialPerformance,

      // ── Section 4: Platform Analytics Donut ───────────────────────────────
      planDistribution,

      // ── Section 5: AI Usage Reports Area Chart ─────────────────────────────
      // No ai_generations table exists yet
      aiUsageTimeSeries: { dataAvailable: false },

      // ── Section 6: Top Performing Content Table ────────────────────────────
      // No posts table exists yet
      topContent: { dataAvailable: false, items: [] },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Period Window Helper
  //
  // day   → current: last 24 h      | previous: 24–48 h ago
  // week  → current: last 7 days    | previous: 7–14 days ago
  // month → current: last 12 months | previous: 12–24 months ago
  // ─────────────────────────────────────────────────────────────────────────────
  private buildPeriodWindow(period: AnalyticsPeriod): PeriodWindow {
    const now = new Date();

    if (period === 'day') {
      const oneDayMs = 24 * 60 * 60 * 1000;
      return {
        currentStart: new Date(now.getTime() - oneDayMs),
        currentEnd: now,
        previousStart: new Date(now.getTime() - 2 * oneDayMs),
        previousEnd: new Date(now.getTime() - oneDayMs),
      };
    }

    if (period === 'week') {
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      return {
        currentStart: new Date(now.getTime() - oneWeekMs),
        currentEnd: now,
        previousStart: new Date(now.getTime() - 2 * oneWeekMs),
        previousEnd: new Date(now.getTime() - oneWeekMs),
      };
    }

    // month: 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return {
      currentStart: new Date(now.getTime() - thirtyDaysMs),
      currentEnd: now,
      previousStart: new Date(now.getTime() - 2 * thirtyDaysMs),
      previousEnd: new Date(now.getTime() - thirtyDaysMs),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KPI: Customer Growth
  // Counts new user registrations in the current vs previous window.
  // ─────────────────────────────────────────────────────────────────────────────
  private async getCustomerGrowthKpi(window: PeriodWindow) {
    const [currentRes, previousRes] = await Promise.all([
      this.db
        .select({ val: count() })
        .from(schema.users)
        .where(
          and(
            gte(schema.users.createdAt, window.currentStart),
            lte(schema.users.createdAt, window.currentEnd),
          ),
        ),
      this.db
        .select({ val: count() })
        .from(schema.users)
        .where(
          and(
            gte(schema.users.createdAt, window.previousStart),
            lte(schema.users.createdAt, window.previousEnd),
          ),
        ),
    ]);

    const current = Number(currentRes[0]?.val ?? 0);
    const previous = Number(previousRes[0]?.val ?? 0);
    const trendPercent =
      previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      dataAvailable: true,
      currentPeriodCount: current,
      previousPeriodCount: previous,
      trendPercent: parseFloat(trendPercent.toFixed(1)),
      direction: this.trendDirection(trendPercent),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KPI: Revenue Growth
  // Sums successful payment amounts (stored in kobo) in both windows.
  // Returns figures converted to Naira.
  // ─────────────────────────────────────────────────────────────────────────────
  private async getRevenueKpi(window: PeriodWindow) {
    const [currentRes, previousRes] = await Promise.all([
      this.db
        .select({ val: sum(schema.payments.amount) })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, 'successful'),
            gte(schema.payments.createdAt, window.currentStart),
            lte(schema.payments.createdAt, window.currentEnd),
          ),
        ),
      this.db
        .select({ val: sum(schema.payments.amount) })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, 'successful'),
            gte(schema.payments.createdAt, window.previousStart),
            lte(schema.payments.createdAt, window.previousEnd),
          ),
        ),
    ]);

    const currentKobo = Number(currentRes[0]?.val ?? 0);
    const previousKobo = Number(previousRes[0]?.val ?? 0);
    const currentNaira = currentKobo / 100;
    const previousNaira = previousKobo / 100;
    const trendPercent =
      previousNaira > 0
        ? ((currentNaira - previousNaira) / previousNaira) * 100
        : 0;

    return {
      dataAvailable: true,
      currentPeriodNaira: parseFloat(currentNaira.toFixed(2)),
      previousPeriodNaira: parseFloat(previousNaira.toFixed(2)),
      trendPercent: parseFloat(trendPercent.toFixed(1)),
      direction: this.trendDirection(trendPercent),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Revenue Time Series
  //
  // Buckets successful payments into hourly / daily / monthly slots.
  // Returns a zero-filled array so the frontend always gets the full shape.
  //
  //  day   → 24 hourly buckets  e.g. "00:00" … "23:00"
  //  week  → 7 daily buckets    e.g. "Mon" … "Sun"
  //  month → 12 monthly buckets e.g. "Jan" … "Dec"
  // ─────────────────────────────────────────────────────────────────────────────
  private async getRevenueTimeSeries(period: AnalyticsPeriod, window: PeriodWindow) {
    const { groupExpr, keyExpr } = this.getBucketExpressions(period);

    const rows = await this.db
      .select({
        bucketKey: keyExpr,
        amountKobo: sum(schema.payments.amount),
        transactionCount: count(),
      })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.status, 'successful'),
          gte(schema.payments.createdAt, window.currentStart),
          lte(schema.payments.createdAt, window.currentEnd),
        ),
      )
      .groupBy(groupExpr)
      .orderBy(groupExpr);

    // Build lookup: DB key string → { amountNaira, transactionCount }
    const dataMap = new Map<string, { amountNaira: number; transactionCount: number }>();
    for (const row of rows) {
      dataMap.set(String(row.bucketKey), {
        amountNaira: parseFloat((Number(row.amountKobo ?? 0) / 100).toFixed(2)),
        transactionCount: Number(row.transactionCount ?? 0),
      });
    }

    // Generate full bucket array, zero-filling any missing periods
    const buckets = this.generateBuckets(period, window.currentStart, window.currentEnd);

    return {
      dataAvailable: true,
      buckets: buckets.map(({ label, key }) => ({
        label,
        amountNaira: dataMap.get(key)?.amountNaira ?? 0,
        transactionCount: dataMap.get(key)?.transactionCount ?? 0,
      })),
    };
  }

  /**
   * Returns two SQL expressions per period:
   *   groupExpr — used for GROUP BY and ORDER BY (date_trunc produces a sortable timestamp)
   *   keyExpr   — used in SELECT to produce a string key that matches generateBuckets() output
   *
   * String literals ('hour', 'day', 'month') are inlined as SQL, NOT as bind parameters,
   * because PostgreSQL does not accept them as parameterised values in date_trunc/to_char.
   */
  private getBucketExpressions(period: AnalyticsPeriod) {
    if (period === 'day') {
      return {
        groupExpr: sql`date_trunc('hour',  ${schema.payments.createdAt})`,
        keyExpr: sql<string>`to_char(date_trunc('hour',  ${schema.payments.createdAt}), 'YYYY-MM-DD HH24')`,
      };
    }
    if (period === 'week') {
      return {
        groupExpr: sql`date_trunc('day',   ${schema.payments.createdAt})`,
        keyExpr: sql<string>`to_char(date_trunc('day',   ${schema.payments.createdAt}), 'YYYY-MM-DD')`,
      };
    }
    // month (30 days) - bucket by day
    return {
      groupExpr: sql`date_trunc('day', ${schema.payments.createdAt})`,
      keyExpr: sql<string>`to_char(date_trunc('day', ${schema.payments.createdAt}), 'YYYY-MM-DD')`,
    };
  }

  /**
   * Generates all expected bucket labels + DB-key strings for the given period window.
   * Uses UTC arithmetic throughout so the keys align with PostgreSQL's UTC date_trunc output.
   */
  private generateBuckets(
    period: AnalyticsPeriod,
    start: Date,
    end: Date,
  ): { label: string; key: string }[] {
    const buckets: { label: string; key: string }[] = [];

    if (period === 'day') {
      const cursor = new Date(start);
      cursor.setUTCMinutes(0, 0, 0);
      while (cursor <= end) {
        const yyyy = cursor.getUTCFullYear();
        const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getUTCDate()).padStart(2, '0');
        const hh = String(cursor.getUTCHours()).padStart(2, '0');
        buckets.push({ label: `${hh}:00`, key: `${yyyy}-${mm}-${dd} ${hh}` });
        cursor.setUTCHours(cursor.getUTCHours() + 1);
      }
      return buckets;
    }

    if (period === 'week') {
      const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const cursor = new Date(start);
      cursor.setUTCHours(0, 0, 0, 0);
      while (cursor <= end) {
        const yyyy = cursor.getUTCFullYear();
        const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getUTCDate()).padStart(2, '0');
        buckets.push({ label: DAY_NAMES[cursor.getUTCDay()], key: `${yyyy}-${mm}-${dd}` });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      return buckets;
    }

    // month — rolling 30 daily buckets
    const cursor = new Date(start);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor <= end) {
      const yyyy = cursor.getUTCFullYear();
      const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getUTCDate()).padStart(2, '0');
      buckets.push({ label: `${mm}/${dd}`, key: `${yyyy}-${mm}-${dd}` });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return buckets;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Social Performance
  // Counts connected social accounts grouped by platform.
  // reach / engagement / conversion are null until a posts table exists.
  // ─────────────────────────────────────────────────────────────────────────────
  private async getSocialPerformance() {
    const ALL_PLATFORMS = [
      'facebook', 'instagram', 'tiktok', 'x', 'youtube', 'linkedin',
    ] as const;

    const rows = await this.db
      .select({
        platform: schema.social_accounts.platform,
        connectedCount: count(),
      })
      .from(schema.social_accounts)
      .where(eq(schema.social_accounts.status, 'connected'))
      .groupBy(schema.social_accounts.platform);

    const countMap = new Map<string, number>(
      rows.map((row) => [row.platform, Number(row.connectedCount ?? 0)]),
    );

    return {
      dataAvailable: true,
      note: 'connectedAccounts is live data; reach/engagement/conversion require a future posts table',
      platforms: ALL_PLATFORMS.map((platform) => ({
        platform,
        connectedAccounts: countMap.get(platform) ?? 0,
        reach: null, // not yet available
        engagement: null, // not yet available
        conversion: null, // not yet available
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Plan Distribution
  // Counts active subscriptions grouped by plan, with percentage share.
  // Powers the donut chart on the Analytics page.
  // ─────────────────────────────────────────────────────────────────────────────
  private async getPlanDistribution() {
    const rows = await this.db
      .select({
        planSlug: schema.plans.slug,
        planName: schema.plans.name,
        subCount: count(),
      })
      .from(schema.subscriptions)
      .innerJoin(schema.plans, eq(schema.subscriptions.planId, schema.plans.id))
      .where(eq(schema.subscriptions.status, 'active'))
      .groupBy(schema.plans.slug, schema.plans.name);

    const total = rows.reduce((acc, row) => acc + Number(row.subCount ?? 0), 0);

    return {
      dataAvailable: true,
      totalActiveSubscriptions: total,
      breakdown: rows.map((row) => {
        const n = Number(row.subCount ?? 0);
        return {
          planSlug: row.planSlug,
          planName: row.planName,
          count: n,
          percentage: total > 0 ? parseFloat(((n / total) * 100).toFixed(1)) : 0,
        };
      }),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────────
  private trendDirection(pct: number): 'up' | 'down' | 'flat' {
    if (pct > 0.05) return 'up';
    if (pct < -0.05) return 'down';
    return 'flat';
  }
}
