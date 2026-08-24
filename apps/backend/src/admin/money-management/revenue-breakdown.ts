// revenue-breakdown.ts

export type BreakdownDimension = 'plan' | 'payment_method' | 'billing_period' | 'revenue_source';

export interface RevenueBreakdownQuery {
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

export interface BreakdownItem {
  key: string;
  label: string;
  totalRevenue: number;
  transactionCount: number;
  percentage: number;
}

export interface RevenueBreakdownResponse {
  totalRevenue: number;
  currency: string;
  bySubscriptionPlan: BreakdownItem[];
  byPaymentMethod: BreakdownItem[];
  byBillingPeriod: BreakdownItem[];
  byRevenueSource: BreakdownItem[];
  lastUpdated: Date;
}

export class RevenueBreakdownService {
  constructor(private readonly transactionDbModel: any) {}

  async getRevenueBreakdown(query: RevenueBreakdownQuery): Promise<RevenueBreakdownResponse> {
    const currency = query.currency || 'USD';
    const matchFilter: Record<string, any> = { status: 'successful', currency };

    if (query.startDate || query.endDate) {
      matchFilter.createdAt = {};
      if (query.startDate) matchFilter.createdAt.$gte = query.startDate;
      if (query.endDate) matchFilter.createdAt.$lte = query.endDate;
    }

    const [bySubscriptionPlan, byPaymentMethod, byBillingPeriod, byRevenueSource] = await Promise.all([
      this.aggregateByDimension(matchFilter, '$planId', '$planName'),
      this.aggregateByDimension(matchFilter, '$paymentMethod', '$paymentMethod'),
      this.aggregateByDimension(matchFilter, '$billingPeriod', '$billingPeriod'),
      this.aggregateByDimension(matchFilter, '$revenueSource', '$revenueSource'),
    ]);

    const totalRevenue = bySubscriptionPlan.reduce((acc, item) => acc + item.totalRevenue, 0);

    return {
      totalRevenue,
      currency,
      bySubscriptionPlan,
      byPaymentMethod,
      byBillingPeriod,
      byRevenueSource,
      lastUpdated: new Date(),
    };
  }

  private async aggregateByDimension(
    matchFilter: Record<string, any>,
    groupField: string,
    labelField: string
  ): Promise<BreakdownItem[]> {
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: groupField,
          label: { $first: labelField },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];

    const results = await this.transactionDbModel.aggregate(pipeline);
    const overallTotal = results.reduce((acc: number, item: any) => acc + item.totalRevenue, 0);

    return results.map((item: any) => ({
      key: item._id || 'unspecified',
      label: item.label || item._id || 'Unspecified',
      totalRevenue: item.totalRevenue,
      transactionCount: item.transactionCount,
      percentage: overallTotal > 0 ? Number(((item.totalRevenue / overallTotal) * 100).toFixed(2)) : 0,
    }));
  }
}