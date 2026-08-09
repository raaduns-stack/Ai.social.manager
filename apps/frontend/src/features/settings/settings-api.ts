import api from '../../lib/api-client'

// Company Info Interfaces
export interface CompanyInfo {
  id: number | string
  userId: string
  businessName: string
  businessDescription: string | null
  industry: string | null
  website: string | null
  contactEmail: string | null
  contactPhone: string | null
  addressLine1: string | null
  city: string | null
  country: string | null
  logoUrl: string | null
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateCompanyInfoData {
  businessName?: string
  businessDescription?: string
  industry?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  addressLine1?: string
  city?: string
  country?: string
  logoUrl?: string
}

// Notification Preference Interfaces
export interface NotificationPreference {
  notificationType: string
  emailEnabled: boolean
  inAppEnabled: boolean
  whatsappEnabled: boolean
  emailAvailable: boolean
  inAppAvailable: boolean
  whatsappAvailable: boolean
}

export interface UserNotificationPreference {
  id: number | string
  userId: string
  notificationType: string
  emailEnabled: boolean
  inAppEnabled: boolean
  whatsappEnabled: boolean
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateNotificationPreferenceData {
  emailEnabled?: boolean
  inAppEnabled?: boolean
  whatsappEnabled?: boolean
}

// --- API Functions ---

// Company Info
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const response = await api.get<CompanyInfo>('/profile/company')
  return response.data
}

export async function updateCompanyInfo(data: UpdateCompanyInfoData): Promise<CompanyInfo> {
  const response = await api.patch<CompanyInfo>('/profile/company', data)
  return response.data
}

// Notification Preferences
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const response = await api.get<NotificationPreference[]>('/profile/notification-preferences')
  return response.data
}

export async function updateNotificationPreference(
  notificationType: string,
  data: UpdateNotificationPreferenceData,
): Promise<UserNotificationPreference> {
  const response = await api.patch<UserNotificationPreference>(
    `/profile/notification-preferences/${notificationType}`,
    data,
  )
  return response.data
}
