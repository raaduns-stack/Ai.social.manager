import api from '../../lib/api-client'

export interface DashboardSummary {
  activeSubscription: {
    planName: string
    status: string
  }
}

export async function getMyDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/my-summary')
  return response.data
}
