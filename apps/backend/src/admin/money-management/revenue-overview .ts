// revenue-overview.ts

/**
 * Supported timeframes for revenue analytics
 */
export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'annual';

/**
 * Request filters for querying revenue overview
 */
export interface RevenueOverviewQuery {
    timeframe: Timeframe;
    startDate?: Date;
    endDate?: Date;
    currency?: string;
}

/**
 * Individual data point for charts/breakdowns
 */
export interface RevenueDataPoint {
    timestamp: Date | string;
    amount: number;
    label: string; // e.g., "Mon", "Jan", "2026"
}

/**
 * Summary metrics response for the Admin Dashboard
 */
export interface RevenueOverviewResponse {
    totalRevenue: number;
    timeframe: Timeframe;
    currency: string;
    dataPoints: RevenueDataPoint[];
    growthPercentage: number; // Growth compared to previous period
    previousPeriodTotal: number;
    lastUpdated: Date;
}

/**
 * Service handling Revenue Overview business logic
 */
export class RevenueOverviewService {
    /**
     * Fetches the total revenue overview based on specified timeframe filters
     */
    async getRevenueOverview(query: RevenueOverviewQuery): Promise<RevenueOverviewResponse> {
        const currency = query.currency || 'USD';

        // TODO: Replace with database aggregation query (e.g., MongoDB, PostgreSQL, ORM)
        const dataPoints = await this.fetchRevenueDataFromDatabase(query);
        const totalRevenue = this.calculateTotalRevenue(dataPoints);

        // Example growth calculation (Placeholder values)
        const previousPeriodTotal = 0;
        const growthPercentage = this.calculateGrowth(totalRevenue, previousPeriodTotal);

        return {
            totalRevenue,
            timeframe: query.timeframe,
            currency,
            dataPoints,
            growthPercentage,
            previousPeriodTotal,
            lastUpdated: new Date(),
        };
    }

    /**
     * Helper method to sum up revenue data points
     */
    private calculateTotalRevenue(dataPoints: RevenueDataPoint[]): number {
        return dataPoints.reduce((acc, point) => acc + point.amount, 0);
    }

    /**
     * Helper method to calculate percentage growth rate
     */
    private calculateGrowth(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(2));
    }

    /**
     * Database mock layer (Replace with your actual DB queries)
     */
    private async fetchRevenueDataFromDatabase(query: RevenueOverviewQuery): Promise<RevenueDataPoint[]> {
        // Example structure of returned aggregated data
        return [
            { timestamp: new Date(), amount: 1500, label: 'Current Period' }
        ];
    }
}