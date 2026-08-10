// Placeholder file for dashboard analytics API
import api from '../../lib/api-client'

export interface ConnectedPlatform {
    platform: string
    accountHandle: string
    connectedAt: string | null
}

export interface MyAnalyticsSummary {
    connectedAccountsCount: number
    connectedPlatforms: ConnectedPlatform[]
}

export async function getMyAnalyticsSummary(): Promise<MyAnalyticsSummary> {
    const response = await api.get<MyAnalyticsSummary>('/dashboard/my-analytics-summary')
    return response.data
}