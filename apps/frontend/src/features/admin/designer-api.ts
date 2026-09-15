import api from '../../lib/api-client'

export async function getDesignerDashboardSummary(period = 'weekly') {
  const response = await api.get(`/admin/designer-management/dashboard-summary?period=${period}`)
  return response.data
}

export async function getDesignerTasks(period = 'weekly') {
  const response = await api.get(`/admin/designer-management/tasks?period=${period}`)
  return response.data
}

export async function getDesignerSubmissions(period = 'weekly') {
  const response = await api.get(`/admin/designer-management/submissions?period=${period}`)
  return response.data
}

export async function getDesignerPayments(period = 'weekly') {
  const response = await api.get(`/admin/designer-management/payments?period=${period}`)
  return response.data
}

export async function getDesignerActivities(period = 'weekly') {
  const response = await api.get(`/admin/designer-management/activities?period=${period}`)
  return response.data
}

export async function getDesigners() {
  const response = await api.get('/admin/designer-management/designers')
  return response.data
}

export async function getDesignerProfile(id: string) {
  const response = await api.get(`/admin/designer-management/designers/${id}`)
  return response.data
}
