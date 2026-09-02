import api from '../../lib/api-client'

export async function getCustomerNotifications(params) {
  const response = await api.get('/notifications', {
    params: {
      unreadOnly: params?.unreadOnly,
      limit: params?.limit,
      offset: params?.offset,
    },
  })
  return response.data
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count')
  const payload = response.data
  if (typeof payload === 'number') return payload
  if (payload && typeof payload.count === 'number') return payload.count
  return 0
}

export async function markAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`)
  return response.data
}

export async function markAllAsRead() {
  const response = await api.patch('/notifications/read-all')
  return response.data
}

export async function deleteNotification(id) {
  await api.delete(`/notifications/${id}`)
}
