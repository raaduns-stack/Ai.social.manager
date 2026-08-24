// subscription-revenue.ts

/**
 * Types of subscription movement events
 */
export type SubscriptionEventType =
  | 'new_subscription'
  | 'renewal'
  | 'upgrade'
  | 'downgrade';

/**
 * Filter parameters for querying subscription revenue
 */
export interface SubscriptionRevenueQuery {
  startDate?: Date;
  endDate?: Date;
  planId?: string;
  billingCycle?: 'monthly' | 'annual';
}

/**
 * Monetary breakdown by subscription event type
 */
export interface EventRevenueMetric {
  eventType: SubscriptionEventType;
  count: number;
  totalRevenue: number;
}

/**
 * Core recurring revenue metrics (MRR/ARR)
 */
export interface RecurringRevenueMetrics {
  monthlyRecurringRevenue: number; // MRR
  annualRecurringRevenue: number;  // ARR
  netNewMrr: number;               // (New MRR + Expansion MRR) - (Contraction MRR + Churned MRR)
  averageRevenuePerUser: number;  // ARPU
}

/**
 * Main API response structure for Subscription Revenue
 */
export interface SubscriptionRevenueResponse {
  recurringMetrics: RecurringRevenueMetrics;
  revenueByEventType: Record<SubscriptionEventType, EventRevenueMetric>;
  activeSubscriptionsCount: number;
  currency: string;
  lastUpdated: Date;
}

/**
 * Service managing subscription trends and recurring revenue calculations
 */
export class SubscriptionRevenueService {
  /**
   * Fetches subscription revenue trends and recurring financial metrics
   */
  async getSubscriptionRevenue(
    query: SubscriptionRevenueQuery
  ): Promise<SubscriptionRevenueResponse> {
    const currency = 'USD';

    const revenueByEventType = await this.aggregateSubscriptionEvents(query);
    const recurringMetrics = await this.calculateRecurringMetrics(query);
    const activeSubscriptionsCount = await this.getActiveSubscriptionsCount(query);

    return {
      recurringMetrics,
      revenueByEventType,
      activeSubscriptionsCount,
      currency,
      lastUpdated: new Date(),
    };
  }

  /**
   * Aggregates subscription revenue across movement types
   */
  private async aggregateSubscriptionEvents(
    _query: SubscriptionRevenueQuery
  ): Promise<Record<SubscriptionEventType, EventRevenueMetric>> {
    // TODO: Replace with database query aggregating subscription logs
    return {
      new_subscription: { eventType: 'new_subscription', count: 40, totalRevenue: 4000 },
      renewal: { eventType: 'renewal', count: 120, totalRevenue: 12000 },
      upgrade: { eventType: 'upgrade', count: 15, totalRevenue: 1500 },
      downgrade: { eventType: 'downgrade', count: 5, totalRevenue: -250 },
    };
  }

  /**
   * Computes MRR, ARR, Net New MRR, and ARPU
   */
  private async calculateRecurringMetrics(
    _query: SubscriptionRevenueQuery
  ): Promise<RecurringRevenueMetrics> {
    // Placeholder numbers - replace with actual DB aggregation
    const mrr = 16450;
    const arr = mrr * 12;
    const activeUsers = 160;

    return {
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: arr,
      netNewMrr: 4450,
      averageRevenuePerUser: activeUsers > 0 ? Number((mrr / activeUsers).toFixed(2)) : 0,
    };
  }

  /**
   * Fetches total active subscription count
   */
  private async getActiveSubscriptionsCount(_query: SubscriptionRevenueQuery): Promise<number> {
    return 160;
  }
}