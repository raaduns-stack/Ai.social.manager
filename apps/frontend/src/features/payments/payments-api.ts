import api from '../../lib/api-client'

export async function initializePayment(planId: string): Promise<{ link: string }> {
  const response = await api.post<{ link: string }>('/payments/initialize', { planId })
  return response.data
}

export async function verifyPayment(transactionId: string): Promise<any> {
  const response = await api.post<any>(`/payments/verify/${transactionId}`)
  return response.data
}
