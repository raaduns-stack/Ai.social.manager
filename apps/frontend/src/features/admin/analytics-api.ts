import api from '../../lib/api-client'

export interface AdminRevenueTrendPoint {
  label: string
  amount: number
}

export interface AdminPlanDistributionItem {
  planName: string
  count: number
  percent: number
}

export interface AdminAnalyticsSummary {
  totalCustomers: number
  newCustomersThisPeriod: number
  customerGrowthPercent: number
  activeSubscriptions: number
  expiredSubscriptions: number
  revenueThisPeriod: number
  revenueGrowthPercent: number
  revenueTrend: AdminRevenueTrendPoint[]
  planDistribution: AdminPlanDistributionItem[]
}

export async function getAdminAnalyticsSummary(period = 'weekly'): Promise<AdminAnalyticsSummary> {
  const response = await api.get<AdminAnalyticsSummary>(`/admin/analytics-summary?period=${period}`)
  return response.data
}
