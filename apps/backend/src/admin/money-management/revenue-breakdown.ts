// revenue-breakdown.ts

/**
 * Supported dimensions for breaking down revenue data
 */
export type BreakdownDimension =
    | 'plan'
    | 'payment_method'
    | 'billing_period'
    | 'revenue_source';

/**
 * Filter parameters for querying revenue breakdowns
 */
export interface RevenueBreakdownQuery {
    startDate?: Date;
    endDate?: Date;
    dimension?: BreakdownDimension; // If omitted, all dimensions are returned
    currency?: string;
}

/**
 * Generic itemized revenue metric entry
 */
export interface BreakdownItem {
    key: string;            // Name of the segment (e.g., "Pro Plan", "Stripe", "Annual")
    label: string;          // Human-readable display title
    totalRevenue: number;   // Monetary value earned
    transactionCount: number; // Total transactions in this segment
    percentage: number;     // Percentage share of total revenue
}

/**
 * Detailed multi-category revenue breakdown payload for Admin view
 */
export interface RevenueBreakdownResponse {
    totalRevenue: number;
    currency: string;
    bySubscriptionPlan: BreakdownItem[];
    byPaymentMethod: BreakdownItem[];
    byBillingPeriod: BreakdownItem[];
    byRevenueSource: BreakdownItem[];
    lastUpdated: Date;
}

/**
 * Service handling granular multi-dimensional revenue analytics
 */
export class RevenueBreakdownService {
    /**
     * Generates a detailed breakdown of total revenue across multiple categories
     */
    async getRevenueBreakdown(
        query: RevenueBreakdownQuery
    ): Promise<RevenueBreakdownResponse> {
        const currency = query.currency || 'USD';

        // TODO: Replace with database query aggregating transaction history by category
        const bySubscriptionPlan = await this.getBreakdownByPlan(query);
        const byPaymentMethod = await this.getBreakdownByPaymentMethod(query);
        const byBillingPeriod = await this.getBreakdownByBillingPeriod(query);
        const byRevenueSource = await this.getBreakdownBySource(query);

        const totalRevenue = bySubscriptionPlan.reduce(
            (acc, item) => acc + item.totalRevenue,
            0
        );

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

    /**
     * Revenue aggregated by subscription plan tier
     */
    private async getBreakdownByPlan(_query: RevenueBreakdownQuery): Promise<BreakdownItem[]> {
        return [
            { key: 'starter', label: 'Starter Plan', totalRevenue: 3000, transactionCount: 100, percentage: 30 },
            { key: 'pro', label: 'Pro Plan', totalRevenue: 5000, transactionCount: 50, percentage: 50 },
            { key: 'enterprise', label: 'Enterprise Plan', totalRevenue: 2000, transactionCount: 5, percentage: 20 },
        ];
    }

    /**
     * Revenue aggregated by processor or payment channel
     */
    private async getBreakdownByPaymentMethod(_query: RevenueBreakdownQuery): Promise<BreakdownItem[]> {
        return [
            { key: 'card', label: 'Credit / Debit Card', totalRevenue: 7000, transactionCount: 120, percentage: 70 },
            { key: 'paypal', label: 'PayPal', totalRevenue: 2000, transactionCount: 30, percentage: 20 },
            { key: 'wire_transfer', label: 'Bank Transfer', totalRevenue: 1000, transactionCount: 5, percentage: 10 },
        ];
    }

    /**
     * Revenue aggregated by recurring interval
     */
    private async getBreakdownByBillingPeriod(_query: RevenueBreakdownQuery): Promise<BreakdownItem[]> {
        return [
            { key: 'monthly', label: 'Monthly Subscriptions', totalRevenue: 6000, transactionCount: 140, percentage: 60 },
            { key: 'annual', label: 'Annual Subscriptions', totalRevenue: 4000, transactionCount: 15, percentage: 40 },
        ];
    }

    /**
     * Revenue aggregated by product/channel source (e.g., base subscription vs add-ons)
     */
    private async getBreakdownBySource(_query: RevenueBreakdownQuery): Promise<BreakdownItem[]> {
        return [
            { key: 'subscription', label: 'Recurring Subscriptions', totalRevenue: 8500, transactionCount: 145, percentage: 85 },
            { key: 'ai_credits', label: 'Extra AI Generation Credits', totalRevenue: 1000, transactionCount: 40, percentage: 10 },
            { key: 'addon_feature', label: 'Custom Branding Add-ons', totalRevenue: 500, transactionCount: 10, percentage: 5 },
        ];
    }
}