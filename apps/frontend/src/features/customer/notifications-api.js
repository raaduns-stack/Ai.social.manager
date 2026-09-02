import api from '../../lib/api-client'

export type CustomerNotification = {
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
  sender?: { id: string; fullName: string } | null
}

export async function getCustomerNotifications(params?: {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}): Promise<CustomerNotification[]> {
  const response = await api.get<CustomerNotification[]>('/notifications', {
    params: {
      unreadOnly: params?.unreadOnly,
      limit: params?.limit,
      offset: params?.offset,
    },
  })
  return response.data
}

export async function getUnreadCount(): Promise<{ count: number } | number> {
  const response = await api.get<any>('/notifications/unread-count')
  const payload = response.data
  if (typeof payload === 'number') return payload
  if (payload && typeof payload.count === 'number') return payload.count
  return 0
}

export async function markAsRead(id: string): Promise<CustomerNotification> {
  const response = await api.patch<CustomerNotification>(`/notifications/${id}/read`)
  return response.data
}

export async function markAllAsRead(): Promise<CustomerNotification[]> {
  const response = await api.patch<CustomerNotification[]>('/notifications/read-all')
  return response.data
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}
