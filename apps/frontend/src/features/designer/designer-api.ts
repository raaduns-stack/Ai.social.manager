import api from '../../lib/api-client'
import type {
  DesignerDashboardSummary,
  DesignerProfile,
  UpdateProfilePayload,
  DesignerTask,
  DesignerSubmission,
  DesignerSubmissionDetail,
  SubmissionActivity,
  DesignerPayment,
  DesignerPaymentMethod,
  UpdatePaymentMethodPayload,
  DesignerNotification,
  DesignerNotificationPrefs,
  UpdateNotificationPrefsPayload,
  ImageToCodeConversion,
  UpdateImageToCodePayload,
} from './designer-types'

export async function getDesignerDashboard(): Promise<DesignerDashboardSummary> {
  const response = await api.get<DesignerDashboardSummary>('/designer/dashboard/summary')
  return response.data
}

export async function getDesignerProfile(): Promise<DesignerProfile> {
  const response = await api.get<DesignerProfile>('/designer/profile')
  return response.data
}

export async function updateDesignerProfile(payload: UpdateProfilePayload): Promise<DesignerProfile> {
  const response = await api.put<DesignerProfile>('/designer/profile', payload)
  return response.data
}

export async function getDesignerTasks(): Promise<DesignerTask[]> {
  const response = await api.get<DesignerTask[]>('/designer/tasks')
  return response.data
}

export async function updateTaskStatus(id: string, status: string): Promise<DesignerTask> {
  const response = await api.patch<DesignerTask>(`/designer/tasks/${id}/status`, { status })
  return response.data
}

export async function getDesignerSubmissions(): Promise<DesignerSubmission[]> {
  const response = await api.get<DesignerSubmission[]>('/designer/submissions')
  return response.data
}

export async function getDesignerSubmission(id: string): Promise<DesignerSubmissionDetail> {
  const response = await api.get<DesignerSubmissionDetail>(`/designer/submissions/${id}`)
  return response.data
}

export async function createSubmission(formData: FormData) {
  const response = await api.post('/designer/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function updateSubmission(id: string, payload: { title?: string; category?: string; description?: string }) {
  const response = await api.put(`/designer/submissions/${id}`, payload)
  return response.data
}

export async function submitSubmission(id: string) {
  const response = await api.post(`/designer/submissions/${id}/submit`)
  return response.data
}

export async function getSubmissionActivity(id: string): Promise<SubmissionActivity[]> {
  const response = await api.get<SubmissionActivity[]>(`/designer/submissions/${id}/activity`)
  return response.data
}

export async function getDesignerPayments(): Promise<DesignerPayment[]> {
  const response = await api.get<DesignerPayment[]>('/designer/payments')
  return response.data
}

export async function getPaymentMethod(): Promise<DesignerPaymentMethod | null> {
  const response = await api.get<DesignerPaymentMethod | null>('/designer/payments/method')
  return response.data
}

export async function updatePaymentMethod(payload: UpdatePaymentMethodPayload): Promise<DesignerPaymentMethod> {
  const response = await api.put<DesignerPaymentMethod>('/designer/payments/method', payload)
  return response.data
}

export async function getDesignerNotifications(): Promise<DesignerNotification[]> {
  const response = await api.get<DesignerNotification[]>('/designer/notifications')
  return response.data
}

export async function markNotificationRead(id: string) {
  const response = await api.put(`/designer/notifications/${id}/read`)
  return response.data
}

export async function markAllNotificationsRead() {
  const response = await api.put('/designer/notifications/read-all')
  return response.data
}

export async function getNotificationPrefs(): Promise<DesignerNotificationPrefs> {
  const response = await api.get<DesignerNotificationPrefs>('/designer/notifications/preferences')
  return response.data
}

export async function updateNotificationPrefs(payload: UpdateNotificationPrefsPayload): Promise<DesignerNotificationPrefs> {
  const response = await api.put<DesignerNotificationPrefs>('/designer/notifications/preferences', payload)
  return response.data
}

export async function changeDesignerPassword(currentPassword: string, newPassword: string) {
  const response = await api.put('/designer/security/password', { currentPassword, newPassword })
  return response.data
}

export async function getImageToCodeConversions(): Promise<ImageToCodeConversion[]> {
  const response = await api.get<ImageToCodeConversion[]>('/designer/image-to-code')
  return response.data
}

export async function updateImageToCode(id: string, payload: UpdateImageToCodePayload) {
  const response = await api.put(`/designer/image-to-code/${id}`, payload)
  return response.data
}

export async function submitImageToCode(id: string) {
  const response = await api.post(`/designer/image-to-code/${id}/submit`)
  return response.data
}
