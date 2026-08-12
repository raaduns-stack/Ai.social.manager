import api from '../../lib/api-client'

// ─── Query params (mirror QueryLoginHistoryDto) ────────────────────────────
export interface LoginHistoryQuery {
  status?: 'success' | 'failure'
  userId?: string
  email?: string
  from?: string      // ISO date string e.g. "2024-01-01"
  to?: string        // ISO date string e.g. "2024-12-31"
  ipAddress?: string
  page?: number
  limit?: number
}

// ─── Single record shape returned by the backend ──────────────────────────
export interface LoginHistoryRecord {
  id: string
  email: string
  status: 'success' | 'failure'
  failureReason: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  region: string | null
  browser: string | null
  os: string | null
  device: string | null
  isSuspicious: boolean
  createdAt: string
  // Joined user fields (null when user was deleted)
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string | null
}

// ─── Paginated response shape ──────────────────────────────────────────────
export interface LoginHistoryResponse {
  data: LoginHistoryRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── API function ──────────────────────────────────────────────────────────
export async function getLoginHistory(
  query: LoginHistoryQuery = {},
): Promise<LoginHistoryResponse> {
  // Remove undefined keys so axios doesn't send empty params
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  )
  const response = await api.get<LoginHistoryResponse>('/admin/login-history', { params })
  return response.data
}
