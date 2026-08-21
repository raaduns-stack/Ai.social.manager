import api from '../../lib/api-client'

export interface AdminUser {
  id: string
  name: string
  fullName: string
  email: string
  businessName: string
  phoneNumber: string
  country: string
  profileImage: string | null
  role: string
  accountStatus: string
  isActive: boolean
  isEmailVerified: boolean
  joinedDate: string
  registeredAt: string
  emailVerifiedAt?: string | null
  firstLoginAt?: string | null
  lastLoginAt?: string | null
  suspendedAt?: string | null
  plan: string
  isPaid: boolean
  kycStatus: string
  kycRecordId?: string | null
  accountManager?: {
    id: string
    name: string
    email: string
  } | null
  status: 'Active' | 'Suspended' | 'Email Pending'
}

export interface UserManagementStats {
  totalUsers: number
  activeUsers: number
  pendingVerification: number
  kycPending: number
  kycUnderReview: number
  suspendedUsers: number
  freeUsers: number
  paidUsers: number
}

export interface StaffManager {
  id: string
  name: string
  email: string
  role: string
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

export async function getAdminUsers(params?: {
  search?: string
  tab?: string
  status?: string
  plan?: string
  country?: string
  kycStatus?: string
}): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users', { params })
  return response.data
}

export async function getAdminUserStats(): Promise<UserManagementStats> {
  const response = await api.get<UserManagementStats>('/admin/users/stats')
  return response.data
}

export async function getStaffManagers(): Promise<StaffManager[]> {
  const response = await api.get<StaffManager[]>('/admin/users/staff-managers')
  return response.data
}

export async function getAdminUserDetail(id: string): Promise<any> {
  const response = await api.get<any>(`/admin/users/${id}`)
  return response.data
}

export async function createAdminUser(data: {
  fullName: string
  email: string
  password?: string
  businessName?: string
  phoneNumber?: string
  country?: string
  role?: string
  accountStatus?: 'ACTIVE' | 'EMAIL_VERIFICATION_PENDING'
  accountManagerId?: string
}): Promise<AdminUser> {
  const response = await api.post<AdminUser>('/admin/users', data)
  return response.data
}

export async function updateAdminUser(id: string, data: {
  fullName?: string
  businessName?: string
  phoneNumber?: string
  country?: string
  role?: string
  accountManagerId?: string
}): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/admin/users/${id}`, data)
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

export async function assignAccountManager(id: string, accountManagerId: string | null): Promise<any> {
  const response = await api.patch<any>(`/admin/users/${id}/account-manager`, { accountManagerId })
  return response.data
}

export async function uploadUserProfileImage(id: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<any>(`/admin/users/${id}/profile-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function uploadMyProfileImage(file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<any>('/auth/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
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
