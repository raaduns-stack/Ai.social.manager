import api from '../../lib/api-client'

export interface AdminDashboardSummary {
  totalCustomers: number
  newCustomersThisPeriod: number
  activeSubscriptions: number
  expiredSubscriptions: number
  revenueThisPeriod: number
}

export async function getAdminDashboardSummary(period = 'weekly'): Promise<AdminDashboardSummary> {
  const response = await api.get<AdminDashboardSummary>(`/admin/dashboard-summary?period=${period}`)
  return response.data
}
