import api from '../../lib/api-client'

export interface PromptTemplate {
  id: string
  name: string
  category: string
  prompt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FeedbackAnalytics {
  totalSuggestions: number
  totalFeedback: number
  upReactions: number
  downReactions: number
  approvalRate: number
  avgRating: number
  ratingDistribution: Array<{
    stars: number
    count: string
    percentage: number
  }>
}

export async function getPrompts(): Promise<PromptTemplate[]> {
  const response = await api.get<PromptTemplate[]>('/admin/prompt-management')
  return response.data
}

export async function createPrompt(data: {
  name: string
  category: string
  prompt: string
  isActive?: boolean
}): Promise<PromptTemplate> {
  const response = await api.post<PromptTemplate>('/admin/prompt-management', data)
  return response.data
}

export async function updatePrompt(
  id: string,
  data: {
    name?: string
    category?: string
    prompt?: string
    isActive?: boolean
  }
): Promise<PromptTemplate> {
  const response = await api.patch<PromptTemplate>(`/admin/prompt-management/${id}`, data)
  return response.data
}

export async function togglePrompt(id: string): Promise<PromptTemplate> {
  const response = await api.patch<PromptTemplate>(`/admin/prompt-management/${id}/toggle`)
  return response.data
}

export async function deletePrompt(id: string): Promise<PromptTemplate> {
  const response = await api.delete<PromptTemplate>(`/admin/prompt-management/${id}`)
  return response.data
}

export async function getFeedbackAnalytics(): Promise<FeedbackAnalytics> {
  const response = await api.get<FeedbackAnalytics>('/admin/prompt-management/feedback-analytics')
  return response.data
}
