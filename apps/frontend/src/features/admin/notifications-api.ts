import api from '../../lib/api-client'

export interface NotificationHistoryItem {
  id: string
  userId: string
  senderId?: string | null
  type: string
  channel: string
  status: string
  priority: string
  title: string
  message: string
  isRead: boolean
  readAt?: string | null
  sentAt?: string | null
  scheduledFor?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  actionUrl?: string | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  user?: { id: string; fullName: string; email: string } | null
  sender?: { id: string; fullName: string; email: string } | null
}

export interface NotificationHistoryPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface NotificationHistoryResponse {
  data: NotificationHistoryItem[]
  pagination: NotificationHistoryPagination
}

export interface SendSystemAnnouncementInput {
  title: string
  message: string
  channel: 'EMAIL' | 'IN_APP' | 'BOTH' | 'WHATSAPP'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  targetUserIds?: string[]
  actionUrl?: string
  metadata?: Record<string, any>
}

export async function sendSystemAnnouncement(
  data: SendSystemAnnouncementInput,
): Promise<{ totalTargeted?: number; records?: NotificationHistoryItem[]; [k: string]: any }> {
  const response = await api.post<any>('/admin/notifications/system-announcement', data)
  return response.data
}

export async function getNotificationHistory(params?: {
  page?: number
  limit?: number
  userId?: string
  type?: string
  status?: string
  channel?: string
  search?: string
  startDate?: string
  endDate?: string
  isRead?: string
}): Promise<NotificationHistoryResponse> {
  const response = await api.get<NotificationHistoryResponse>('/admin/notifications/history', {
    params,
  })
  return response.data
}

export async function sendTaskNotification(data: {
  taskId?: string
  designerId: string
  taskTitle: string
  eventType: 'assigned' | 'updated' | 'approaching_deadline' | 'overdue' | 'completed'
  details?: string
}): Promise<any> {
  const response = await api.post<any>('/admin/notifications/task-event', data)
  return response.data
}

export async function sendSubmissionNotification(data: {
  submissionId?: string
  designerId: string
  title: string
  eventType: 'submitted' | 'reviewed' | 'revision_required' | 'rejected' | 'approved'
  notes?: string
}): Promise<any> {
  const response = await api.post<any>('/admin/notifications/submission-event', data)
  return response.data
}

export async function sendDesignerPaymentNotification(data: {
  paymentId?: string
  designerId: string
  amount: number
  reference?: string
  status: 'pending' | 'approved' | 'processing' | 'successful' | 'failed' | 'declined'
  notes?: string
}): Promise<any> {
  const response = await api.post<any>('/admin/notifications/designer-payment-event', data)
  return response.data
}
