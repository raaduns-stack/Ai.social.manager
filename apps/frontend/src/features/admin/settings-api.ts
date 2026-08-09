import api from '../../lib/api-client'

// 1. Company Profile Interfaces
export interface CompanyProfile {
  id: number | string
  companyName: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  businessDescription: string | null
  registrationNumber: string | null
  taxId: string | null
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateCompanyProfileData {
  companyName?: string
  logoUrl?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  businessDescription?: string
  registrationNumber?: string
  taxId?: string
}

// 2. System Settings Interfaces
export interface SystemSettings {
  id: number | string
  defaultTimezone: string | null
  defaultCurrency: string | null
  maintenanceMode: boolean | null
  allowNewRegistrations: boolean | null
  freeTrialDays: number | null
  contentApprovalRequired: boolean | null
  dateFormat: string | null
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateSystemSettingsData {
  defaultTimezone?: string
  defaultCurrency?: string
  maintenanceMode?: boolean
  allowNewRegistrations?: boolean
  freeTrialDays?: number
  contentApprovalRequired?: boolean
  dateFormat?: string
}

// 3. Notification Settings Interfaces
export interface NotificationTypeSetting {
  id: number | string
  notificationType: string
  emailAvailable: boolean
  inAppAvailable: boolean
  whatsappAvailable: boolean
  isEnabledGlobally: boolean
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateNotificationTypeSettingData {
  emailAvailable?: boolean
  inAppAvailable?: boolean
  whatsappAvailable?: boolean
  isEnabledGlobally?: boolean
}

// 4. Email Config Interfaces
export interface EmailConfig {
  id: number | string
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpSecure: boolean | null
  senderName: string | null
  senderEmail: string | null
  replyToEmail: string | null
  smtpPasswordMasked: string | null
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateEmailConfigData {
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpSecure?: boolean
  senderName?: string
  senderEmail?: string
  replyToEmail?: string
}

// 5. Social API Settings Interfaces
export interface SocialApiSetting {
  id: number | string | null
  platform: string
  clientId: string | null
  clientSecretMasked: string | null
  redirectUri: string | null
  isEnabled: boolean
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdateSocialApiSettingData {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  isEnabled?: boolean
}

// 6. Payment Gateway Settings Interfaces
export interface PaymentGatewaySettings {
  id: number | string
  publicKey: string | null
  secretKeyMasked: string | null
  webhookSecretMasked: string | null
  supportedMethods: string[] | null
  isLiveMode: boolean | null
  isEnabled: boolean | null
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export interface UpdatePaymentGatewaySettingsData {
  publicKey?: string
  secretKey?: string
  webhookSecret?: string
  supportedMethods?: string[]
  isLiveMode?: boolean
  isEnabled?: boolean
}

// --- API Functions ---

// Company Profile
export async function getCompanyProfile(): Promise<CompanyProfile> {
  const response = await api.get<CompanyProfile>('/admin/settings/company-profile')
  return response.data
}

export async function updateCompanyProfile(data: UpdateCompanyProfileData): Promise<CompanyProfile> {
  const response = await api.patch<CompanyProfile>('/admin/settings/company-profile', data)
  return response.data
}

// System Settings
export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await api.get<SystemSettings>('/admin/settings/system')
  return response.data
}

export async function updateSystemSettings(data: UpdateSystemSettingsData): Promise<SystemSettings> {
  const response = await api.patch<SystemSettings>('/admin/settings/system', data)
  return response.data
}

// Notification Settings
export async function getNotificationSettings(): Promise<NotificationTypeSetting[]> {
  const response = await api.get<NotificationTypeSetting[]>('/admin/settings/notifications')
  return response.data
}

export async function updateNotificationTypeSetting(
  notificationType: string,
  data: UpdateNotificationTypeSettingData,
): Promise<NotificationTypeSetting> {
  const response = await api.patch<NotificationTypeSetting>(`/admin/settings/notifications/${notificationType}`, data)
  return response.data
}

// Email Config
export async function getEmailConfig(): Promise<EmailConfig> {
  const response = await api.get<EmailConfig>('/admin/settings/email')
  return response.data
}

export async function updateEmailConfig(data: UpdateEmailConfigData): Promise<EmailConfig> {
  const response = await api.patch<EmailConfig>('/admin/settings/email', data)
  return response.data
}

export async function sendTestEmail(testRecipientEmail: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>('/admin/settings/email/test', {
    testRecipientEmail,
  })
  return response.data
}

// Social API Settings
export async function getSocialApiSettings(): Promise<SocialApiSetting[]> {
  const response = await api.get<SocialApiSetting[]>('/admin/settings/social-api')
  return response.data
}

export async function updateSocialApiSetting(
  platform: string,
  data: UpdateSocialApiSettingData,
): Promise<SocialApiSetting> {
  const response = await api.patch<SocialApiSetting>(`/admin/settings/social-api/${platform}`, data)
  return response.data
}

// Payment Gateway Settings
export async function getPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  const response = await api.get<PaymentGatewaySettings>('/admin/settings/payment-gateway')
  return response.data
}

export async function updatePaymentGatewaySettings(
  data: UpdatePaymentGatewaySettingsData,
): Promise<PaymentGatewaySettings> {
  const response = await api.patch<PaymentGatewaySettings>('/admin/settings/payment-gateway', data)
  return response.data
}
