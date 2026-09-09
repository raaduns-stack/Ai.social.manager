// subscription-revenue.ts
import { Pool } from '@neondatabase/serverless';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export type SubscriptionEventType =
  | 'new_subscription'
  | 'renewal'
  | 'upgrade'
  | 'downgrade';

export interface SubscriptionRevenueQuery {
  startDate?: Date;
  endDate?: Date;
  planId?: string;
  billingCycle?: 'monthly' | 'annual';
}

export interface EventRevenueMetric {
  eventType: SubscriptionEventType;
  count: number;
  totalRevenue: number;
}

export interface RecurringRevenueMetrics {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  netNewMrr: number;
  averageRevenuePerUser: number;
}

export interface SubscriptionRevenueResponse {
  recurringMetrics: RecurringRevenueMetrics;
  revenueByEventType: Record<SubscriptionEventType, EventRevenueMetric>;
  activeSubscriptionsCount: number;
  currency: string;
  lastUpdated: Date;
}

export class SubscriptionRevenueService {
  constructor(
    private readonly subscriptionLogModel: any,
    private readonly activeSubscriptionsModel: any
  ) {}

  async getSubscriptionRevenue(query: SubscriptionRevenueQuery): Promise<SubscriptionRevenueResponse> {
    const currency = 'USD';
    const matchFilter: Record<string, any> = {};

    if (query.planId) matchFilter.planId = query.planId;
    if (query.billingCycle) matchFilter.billingCycle = query.billingCycle;
    if (query.startDate || query.endDate) {
      matchFilter.createdAt = {};
      if (query.startDate) matchFilter.createdAt.$gte = query.startDate;
      if (query.endDate) matchFilter.createdAt.$lte = query.endDate;
    }

    // Live Aggregation across Event Types
    const eventPipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ];

    // Live Active Subscriptions Count & MRR Computation
    const activePipeline = [
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          activeCount: { $sum: 1 },
          totalMrr: { $sum: '$monthlyPrice' },
        },
      },
    ];

    const [eventResults, activeResults] = await Promise.all([
      this.subscriptionLogModel.aggregate(eventPipeline),
      this.activeSubscriptionsModel.aggregate(activePipeline),
    ]);

    const revenueByEventType: Record<SubscriptionEventType, EventRevenueMetric> = {
      new_subscription: { eventType: 'new_subscription', count: 0, totalRevenue: 0 },
      renewal: { eventType: 'renewal', count: 0, totalRevenue: 0 },
      upgrade: { eventType: 'upgrade', count: 0, totalRevenue: 0 },
      downgrade: { eventType: 'downgrade', count: 0, totalRevenue: 0 },
    };

    eventResults.forEach((res: any) => {
      const type = res._id as SubscriptionEventType;
      if (revenueByEventType[type]) {
        revenueByEventType[type].count = res.count;
        revenueByEventType[type].totalRevenue = res.totalRevenue;
      }
    });

    const activeStats = activeResults[0] || { activeCount: 0, totalMrr: 0 };
    const mrr = activeStats.totalMrr;
    const arr = mrr * 12;
    const activeCount = activeStats.activeCount;

    const newMrr = revenueByEventType.new_subscription.totalRevenue + revenueByEventType.upgrade.totalRevenue;
    const contractionMrr = Math.abs(revenueByEventType.downgrade.totalRevenue);
    const netNewMrr = newMrr - contractionMrr;

    return {
      recurringMetrics: {
        monthlyRecurringRevenue: mrr,
        annualRecurringRevenue: arr,
        netNewMrr,
        averageRevenuePerUser: activeCount > 0 ? Number((mrr / activeCount).toFixed(2)) : 0,
      },
      revenueByEventType,
      activeSubscriptionsCount: activeCount,
      currency,
      lastUpdated: new Date(),
    };
  }
}