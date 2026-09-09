// revenue-overview.ts

import { Pool } from '@neondatabase/serverless';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'annual';

export interface RevenueOverviewQuery {
  timeframe: Timeframe;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

export interface RevenueDataPoint {
  timestamp: Date | string;
  amount: number;
  label: string;
}

export interface RevenueOverviewResponse {
  totalRevenue: number;
  timeframe: Timeframe;
  currency: string;
  dataPoints: RevenueDataPoint[];
  growthPercentage: number;
  previousPeriodTotal: number;
  lastUpdated: Date;
}

export class RevenueOverviewService {
  constructor(private readonly dbContext: any) {}

  async getRevenueOverview(query: RevenueOverviewQuery): Promise<RevenueOverviewResponse> {
    const currency = query.currency || 'USD';
    const { startDate, endDate } = this.resolveDateRange(query);
    const previousRange = this.getPreviousDateRange(startDate, endDate);

    // Aggregation for Current Period
    const currentResults = await this.aggregateRevenue(startDate, endDate, query.timeframe, currency);
    const totalRevenue = currentResults.reduce((acc, point) => acc + point.amount, 0);

    // Aggregation for Previous Period (for Growth Metric)
    const previousResults = await this.aggregateRevenue(previousRange.start, previousRange.end, query.timeframe, currency);
    const previousPeriodTotal = previousResults.reduce((acc, point) => acc + point.amount, 0);

    const growthPercentage = this.calculateGrowth(totalRevenue, previousPeriodTotal);

    return {
      totalRevenue,
      timeframe: query.timeframe,
      currency,
      dataPoints: currentResults,
      growthPercentage,
      previousPeriodTotal,
      lastUpdated: new Date(),
    };
  }

  private async aggregateRevenue(
    startDate: Date,
    endDate: Date,
    timeframe: Timeframe,
    currency: string
  ): Promise<RevenueDataPoint[]> {
    const groupFormat = this.getDateFormatByTimeframe(timeframe);

    const pipeline = [
      {
        $match: {
          status: 'successful',
          currency,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          amount: { $sum: '$amount' },
          timestamp: { $min: '$createdAt' },
        },
      },
      { $sort: { timestamp: 1 } },
    ];

    const results = await this.dbContext.aggregate(pipeline);

    return results.map((item: any) => ({
      timestamp: item.timestamp,
      amount: item.amount,
      label: item._id,
    }));
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private resolveDateRange(query: RevenueOverviewQuery): { startDate: Date; endDate: Date } {
    const endDate = query.endDate || new Date();
    let startDate = query.startDate;

    if (!startDate) {
      startDate = new Date(endDate);
      if (query.timeframe === 'daily') startDate.setDate(endDate.getDate() - 1);
      if (query.timeframe === 'weekly') startDate.setDate(endDate.getDate() - 7);
      if (query.timeframe === 'monthly') startDate.setMonth(endDate.getMonth() - 1);
      if (query.timeframe === 'annual') startDate.setFullYear(endDate.getFullYear() - 1);
    }

    return { startDate, endDate };
  }

  private getPreviousDateRange(start: Date, end: Date): { start: Date; end: Date } {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime()),
    };
  }

  private getDateFormatByTimeframe(timeframe: Timeframe): string {
    switch (timeframe) {
      case 'daily': return '%Y-%m-%d %H:00';
      case 'weekly': return '%Y-%m-%d';
      case 'monthly': return '%Y-%m';
      case 'annual': return '%Y';
    }
  }
}