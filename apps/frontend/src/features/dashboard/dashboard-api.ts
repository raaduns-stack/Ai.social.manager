import api from '../../lib/api-client'

export interface DashboardSummary {
  activeSubscription: {
    planName: string
    status: string
  }
}

export async function getMyDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/my-summary')
  return response.data
}

export async function getSuggestions() {
  const response = await api.get('/content-suggestions')
  return response.data
}

export async function generateCaption(businessType: string) {
  const response = await api.post('/content-suggestions/caption', {
    businessType,
  })

  return response.data
}

export async function generateIdea(businessType: string) {
  const response = await api.post('/content-suggestions/idea', {
    businessType,
  })

  return response.data
}

export async function saveSuggestionFeedback(
  id: string,
  reaction: 'up' | 'down',
  rating: number,
) {
  const response = await api.post(
    `/content-suggestions/${id}/feedback`,
    {
      reaction,
      rating,
    },
  )

  return response.data
}