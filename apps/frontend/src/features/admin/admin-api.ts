import api from '../../lib/api-client'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  joinedDate: string
  plan: string
  planSlug?: string
  isPaid?: boolean
  status: 'Active' | 'Suspended'
}

export interface StaffOverview {
  totalAdmins: number
  totalStaff: number
  activeUsers: number
  disabledAccounts: number
  recentLogins: {
    id: string
    name: string
    role: string
    device: string
    time: string
    status: string
  }[]
}

export interface AdminBillingStats {
  totalRevenue: number
  activeSubscriptions: number
  pendingPayments: number
}

export interface AdminSubscription {
  id: string
  customerName: string
  email: string
  plan: string
  status: string
  renewsOn: string
  amount: number
}

export interface AdminPayment {
  id: string
  customerName: string
  plan: string
  amount: number
  date: string
  method: string
  status: string
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users', {
    headers: { 'Cache-Control': 'no-cache' },
  })
  return response.data
}

export async function getStaffOverview(): Promise<StaffOverview> {
  const response = await api.get<StaffOverview>('/admin/staff/overview', {
    headers: { 'Cache-Control': 'no-cache' },
  })
  return response.data
}

export async function getAdminUserDetail(id: string): Promise<any> {
  const response = await api.get<any>(`/admin/users/${id}`)
  return response.data
}

export async function suspendUser(id: string, suspend: boolean): Promise<any> {
  const response = await api.post<any>(`/admin/users/${id}/suspend`, { suspend })
  return response.data
}

export async function deleteUser(id: string): Promise<any> {
  const response = await api.delete<any>(`/admin/users/${id}`)
  return response.data
}

export async function getAdminBillingStats(): Promise<AdminBillingStats> {
  const response = await api.get<AdminBillingStats>('/admin/billing/stats')
  return response.data
}

export async function getAdminSubscriptions(): Promise<AdminSubscription[]> {
  const response = await api.get<AdminSubscription[]>('/admin/billing/subscriptions')
  return response.data
}

export async function getAdminPayments(): Promise<AdminPayment[]> {
  const response = await api.get<AdminPayment[]>('/admin/billing/payments')
  return response.data
}

export interface BackendRolePermission {
  id: string;
  role: string;
  module: string;
  accessLevel: string;
}

export async function getRolePermissions(): Promise<BackendRolePermission[]> {
  const response = await api.get<BackendRolePermission[]>('/admin/role-permissions')
  return response.data
}

export async function updateRolePermissions(payload: { role: string; permissions: { module: string; accessLevel: string }[] }): Promise<any> {
  const response = await api.patch<any>('/admin/role-permissions', payload)
  return response.data
}

export async function createStaff(payload: any): Promise<any> {
  const response = await api.post<any>('/admin/users/staff', payload)
  return response.data
}

export async function getAdminPlans(): Promise<any[]> {
  const response = await api.get<any[]>('/admin/plans')
  return response.data
}

export async function updateAdminPlan(id: string, payload: any): Promise<any> {
  const response = await api.patch<any>(`/admin/plans/${id}`, payload)
  return response.data
}
