// payment-analytics.ts

export type PaymentStatus = 'successful' | 'pending' | 'failed' | 'refunded';

export interface PaymentAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  gateway?: string;
  status?: PaymentStatus;
}

export interface StatusMetric {
  status: PaymentStatus;
  count: number;
  totalVolume: number;
  percentageOfTotal: number;
}

export interface PaymentFailureReason {
  reasonCode: string;
  description: string;
  count: number;
}

export interface PaymentAnalyticsResponse {
  totalTransactionsCount: number;
  totalVolume: number;
  currency: string;
  metricsByStatus: Record<PaymentStatus, StatusMetric>;
  failureReasons: PaymentFailureReason[];
  successRate: number;
  lastUpdated: Date;
}

export class PaymentAnalyticsService {
  constructor(private readonly dbContext: any) {}

  async getPaymentAnalytics(query: PaymentAnalyticsQuery): Promise<PaymentAnalyticsResponse> {
    const currency = 'USD';
    const matchFilter: Record<string, any> = {};

    if (query.gateway) matchFilter.gateway = query.gateway;
    if (query.status) matchFilter.status = query.status;
    if (query.startDate || query.endDate) {
      matchFilter.createdAt = {};
      if (query.startDate) matchFilter.createdAt.$gte = query.startDate;
      if (query.endDate) matchFilter.createdAt.$lte = query.endDate;
    }

    // Live Aggregation by Status
    const statusPipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalVolume: { $sum: '$amount' },
        },
      },
    ];

    // Live Aggregation for Failure Reasons
    const failurePipeline = [
      { $match: { ...matchFilter, status: 'failed' } },
      {
        $group: {
          _id: '$failureReasonCode',
          description: { $first: '$failureReasonDescription' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];

    const [statusResults, failureResults] = await Promise.all([
      this.dbContext.aggregate(statusPipeline),
      this.dbContext.aggregate(failurePipeline),
    ]);

    const totalTransactionsCount = statusResults.reduce((acc: number, r: any) => acc + r.count, 0);
    const totalVolume = statusResults.reduce((acc: number, r: any) => acc + r.totalVolume, 0);

    const metricsByStatus: Record<PaymentStatus, StatusMetric> = {
      successful: { status: 'successful', count: 0, totalVolume: 0, percentageOfTotal: 0 },
      pending: { status: 'pending', count: 0, totalVolume: 0, percentageOfTotal: 0 },
      failed: { status: 'failed', count: 0, totalVolume: 0, percentageOfTotal: 0 },
      refunded: { status: 'refunded', count: 0, totalVolume: 0, percentageOfTotal: 0 },
    };

    statusResults.forEach((res: any) => {
      const status = res._id as PaymentStatus;
      if (metricsByStatus[status]) {
        metricsByStatus[status].count = res.count;
        metricsByStatus[status].totalVolume = res.totalVolume;
        metricsByStatus[status].percentageOfTotal = totalTransactionsCount > 0
          ? Number(((res.count / totalTransactionsCount) * 100).toFixed(2))
          : 0;
      }
    });

    const failureReasons: PaymentFailureReason[] = failureResults.map((f: any) => ({
      reasonCode: f._id || 'unknown_error',
      description: f.description || 'No description provided',
      count: f.count,
    }));

    const successRate = totalTransactionsCount > 0
      ? Number(((metricsByStatus.successful.count / totalTransactionsCount) * 100).toFixed(2))
      : 0;

    return {
      totalTransactionsCount,
      totalVolume,
      currency,
      metricsByStatus,
      failureReasons,
      successRate,
      lastUpdated: new Date(),
    };
  }
}