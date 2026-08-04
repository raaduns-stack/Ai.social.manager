import api from '../../lib/api-client'
import { Plan } from '@socialpilot/shared-types'

export async function getPlans(): Promise<Plan[]> {
  const response = await api.get<Plan[]>('/plans')
  return response.data
}

export async function getPlan(id: string): Promise<Plan> {
  const response = await api.get<Plan>(`/plans/${id}`)
  return response.data
}
