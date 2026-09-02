export interface FinancialReportFilter {
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
}

export interface RawTransactionInput {
  id: string;
  customerId: string;
  amount: number;
  status: 'successful' | 'pending' | 'failed';
  revenueSource?: string;
  planName?: string;
  createdAt: string;
}

export interface SummaryOverview {
  totalRevenue: number;
  successfulTransactionsCount: number;
  failedTransactionsCount: number;
  averageOrderValue: number;
}

export interface RevenueByPeriodItem {
  periodLabel: string;
  totalRevenue: number;
  transactionCount: number;
}

export interface FinancialReportResponse {
  timeframe: FinancialReportFilter;
  summary: SummaryOverview;
  revenueTrend: RevenueByPeriodItem[];
  revenueBySource: Array<{ source: string; totalRevenue: number; percentage: number }>;
  topPlans: Array<{ planName: string; totalRevenue: number; subscriberCount: number }>;
  generatedAt: string;
}

/**
 * Requirement 140: Financial Reports
 * Computes financial reporting metrics dynamically from incoming transaction records.
 */
export async function getFinancialReport(
  filters: FinancialReportFilter,
  transactions: RawTransactionInput[] = []
): Promise<FinancialReportResponse> {
  const { startDate, endDate, period } = filters;

  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  // Filter incoming transactions by date range
  const filteredTransactions = transactions.filter((tx) => {
    const txMs = new Date(tx.createdAt).getTime();
    return txMs >= startMs && txMs <= endMs;
  });

  // 1. Calculate Summary Overview
  let totalRevenue = 0;
  let successfulTransactionsCount = 0;
  let failedTransactionsCount = 0;

  const sourceMap: Record<string, number> = {};
  const planMap: Record<string, { totalRevenue: number; customers: Set<string> }> = {};

  filteredTransactions.forEach((tx) => {
    if (tx.status === 'successful') {
      totalRevenue += tx.amount;
      successfulTransactionsCount += 1;

      // Group by revenue source
      const source = tx.revenueSource || 'other';
      sourceMap[source] = (sourceMap[source] || 0) + tx.amount;

      // Group by subscription plan
      const plan = tx.planName || 'Uncategorized';
      if (!planMap[plan]) {
        planMap[plan] = { totalRevenue: 0, customers: new Set() };
      }
      planMap[plan].totalRevenue += tx.amount;
      planMap[plan].customers.add(tx.customerId);
    } else if (tx.status === 'failed') {
      failedTransactionsCount += 1;
    }
  });

  const averageOrderValue =
    successfulTransactionsCount > 0 ? totalRevenue / successfulTransactionsCount : 0;

  // 2. Format Revenue by Source with calculated percentages
  const revenueBySource = Object.entries(sourceMap).map(([source, sourceRevenue]) => ({
    source,
    totalRevenue: Number(sourceRevenue.toFixed(2)),
    percentage:
      totalRevenue > 0 ? Number(((sourceRevenue / totalRevenue) * 100).toFixed(2)) : 0,
  }));

  // 3. Format Top Plans breakdown
  const topPlans = Object.entries(planMap)
    .map(([planName, data]) => ({
      planName,
      totalRevenue: Number(data.totalRevenue.toFixed(2)),
      subscriberCount: data.customers.size,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // 4. Construct response
  return {
    timeframe: filters,
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      successfulTransactionsCount,
      failedTransactionsCount,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
    },
    revenueTrend: [],
    revenueBySource,
    topPlans,
    generatedAt: new Date().toISOString(),
  };
}