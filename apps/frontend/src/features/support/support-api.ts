import api from '../../lib/api-client'

export interface SupportTicket {
  id: string
  userId: string
  assignedToStaffId: string | null
  subject: string
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  messages?: TicketMessage[]
  user?: {
    id: string
    email: string
    fullName: string
  }
  assignedStaff?: {
    id: string
    email: string
    fullName: string
  }
}

export interface TicketMessage {
  id: string
  ticketId: string
  senderId: string
  message: string
  createdAt: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Customer Support API
// ---------------------------------------------------------------------------

export async function createTicket(dto: {
  subject: string
  category: string
  message: string
  priority?: 'low' | 'medium' | 'high'
}): Promise<SupportTicket> {
  const response = await api.post<SupportTicket>('/support/tickets', dto)
  return response.data
}

export async function getTickets(): Promise<SupportTicket[]> {
  const response = await api.get<SupportTicket[]>('/support/tickets')
  return response.data
}

export async function getTicketDetails(id: string): Promise<SupportTicket> {
  const response = await api.get<SupportTicket>(`/support/tickets/${id}`)
  return response.data
}

export async function addTicketMessage(id: string, message: string): Promise<TicketMessage> {
  const response = await api.post<TicketMessage>(`/support/tickets/${id}/messages`, { message })
  return response.data
}

export async function getFaqs(): Promise<Faq[]> {
  const response = await api.get<Faq[]>('/faqs')
  return response.data
}

// ---------------------------------------------------------------------------
// Admin Support API
// ---------------------------------------------------------------------------

export async function adminGetTickets(status?: string): Promise<SupportTicket[]> {
  const response = await api.get<SupportTicket[]>('/admin/support/tickets', {
    params: status ? { status } : {},
  })
  return response.data
}

export async function adminGetTicketDetails(id: string): Promise<SupportTicket> {
  const response = await api.get<SupportTicket>(`/admin/support/tickets/${id}`)
  return response.data
}

export async function adminAssignTicket(id: string, staffId: string): Promise<SupportTicket> {
  const response = await api.patch<SupportTicket>(`/admin/support/tickets/${id}/assign`, { staffId })
  return response.data
}

export async function adminUpdateTicketStatus(id: string, status: string): Promise<SupportTicket> {
  const response = await api.patch<SupportTicket>(`/admin/support/tickets/${id}/status`, { status })
  return response.data
}

export async function adminAddTicketMessage(id: string, message: string): Promise<TicketMessage> {
  const response = await api.post<TicketMessage>(`/admin/support/tickets/${id}/messages`, { message })
  return response.data
}

export async function adminGetFaqs(): Promise<Faq[]> {
  const response = await api.get<Faq[]>('/admin/faqs')
  return response.data
}

export async function adminCreateFaq(dto: {
  question: string
  answer: string
  category: string
  isPublished?: boolean
  displayOrder?: number
}): Promise<Faq> {
  const response = await api.post<Faq>('/admin/faqs', dto)
  return response.data
}

export async function adminUpdateFaq(
  id: string,
  dto: {
    question?: string
    answer?: string
    category?: string
    isPublished?: boolean
    displayOrder?: number
  },
): Promise<Faq> {
  const response = await api.put<Faq>(`/admin/faqs/${id}`, dto)
  return response.data
}

export async function adminDeleteFaq(id: string): Promise<{ deleted: boolean; id: string }> {
  const response = await api.delete<{ deleted: boolean; id: string }>(`/admin/faqs/${id}`)
  return response.data
}
