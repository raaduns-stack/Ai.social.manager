import api from '../../lib/api-client'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  joinedDate: string
  plan: string
  status: 'Active' | 'Suspended'
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
  const response = await api.get<AdminUser[]>('/admin/users')
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
