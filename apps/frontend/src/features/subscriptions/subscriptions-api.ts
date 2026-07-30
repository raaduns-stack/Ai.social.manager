import api from '../../lib/api-client'
import { Subscription } from '@socialpilot/shared-types'

export interface UserSubscription extends Subscription {
  plan?: {
    id: string
    name: string
    slug: string
    price: number
    interval: string
    features: any
  }
}

export async function getMySubscription(): Promise<UserSubscription> {
  const response = await api.get<UserSubscription>('/subscription')
  return response.data
}

export async function cancelSubscription(): Promise<UserSubscription> {
  const response = await api.patch<UserSubscription>('/subscription/cancel')
  return response.data
}
