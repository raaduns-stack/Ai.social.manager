import api from '../../lib/api-client'

// ─── Query params (mirror QueryActivityLogsDto) ────────────────────────────
export interface ActivityLogsQuery {
  module?: string
  page?: number
  limit?: number
}

// ─── Single record shape returned by the backend ──────────────────────────
export interface ActivityLogRecord {
  id: string
  userId: string | null
  userName: string | null
  action: string
  module: string
  description: string
  createdAt: string
  userRole: string | null
}

// ─── Paginated response shape ──────────────────────────────────────────────
export interface ActivityLogsResponse {
  data: ActivityLogRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── API function ──────────────────────────────────────────────────────────
export async function getActivityLogs(
  query: ActivityLogsQuery = {},
): Promise<ActivityLogsResponse> {
  // Remove undefined keys so axios doesn't send empty params
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  )
  const response = await api.get<ActivityLogsResponse>('/admin/activity-logs', { params })
  return response.data
}
