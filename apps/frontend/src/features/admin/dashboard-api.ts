import api from '../../lib/api-client'

export interface DashboardUserRow {
  id: string
  name: string
  email: string
  plan: string
  planSlug: string
  isPaid: boolean
  status: string
  joinedDate: string
}

export interface AdminDashboardSummary {
  totalCustomers: number
  customerGrowthPercent: number
  newCustomersThisPeriod: number
  registrationsGrowthPercent: number
  freeUsers: number
  paidUsers: number
  expiredSubscriptions: number
  publishedPosts: number
  publishedPostsGrowthPercent: number
  connectedAccounts: number
  connectedAccountsGrowthPercent: number
  aiContentGenerated: number
  aiContentThisPeriod: number
  aiContentGrowthPercent: number
  publishing: {
    scheduled: number
    published: number
    failed: number
    pending: number
  }
  publishingTrend: { label: string; published: number; scheduled: number }[]
  revenueThisPeriod: number
  revenueGrowthPercent: number
  revenueTrend: { label: string; amount: number }[]
  recentActivity: {
    id: string
    action: string
    module: string
    description: string
    userName: string | null
    createdAt: string
  }[]
  recentPosts: {
    id: string
    status: string
    error: string | null
    attemptedAt: string
    platform: string | null
    content: string | null
  }[]
  freeUsersPreview: DashboardUserRow[]
  paidUsersPreview: DashboardUserRow[]
}

export async function getAdminDashboardSummary(period = 'weekly'): Promise<AdminDashboardSummary> {
  const response = await api.get<AdminDashboardSummary>(`/admin/dashboard-summary?period=${period}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })
  return response.data
}

export async function getAdminDashboardUsers(group: 'free' | 'paid'): Promise<{
  group: 'free' | 'paid'
  count: number
  users: DashboardUserRow[]
}> {
  const response = await api.get(`/admin/dashboard-users?group=${group}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })
  return response.data
}
