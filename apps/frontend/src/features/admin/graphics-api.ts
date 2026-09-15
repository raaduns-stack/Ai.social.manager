import api from '../../lib/api-client'

export interface GraphicsDesigner {
  id: string
  name: string
  email: string
  isActive: boolean
}

export interface GraphicsTask {
  id: string
  title: string
  brief: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'done'
  dueDate: string | null
  designerId: string
  designerName: string | null
  createdAt: string
  updatedAt: string
  submissions: number
}

export interface GraphicsTaskDetail extends GraphicsTask {
  designerEmail: string | null
  submissions: Array<{ id: string; title: string; status: string; updatedAt: string }>
  timeline: Array<{ at: string | null; text: string }>
}

export interface CreateGraphicsTaskPayload {
  title: string
  brief?: string
  priority?: string
  dueDate?: string
  designerId: string
}

export interface UpdateGraphicsTaskPayload {
  title?: string
  brief?: string
  priority?: string
  status?: string
  dueDate?: string
  designerId?: string
}

export interface GraphicsSubmission {
  id: string
  title: string
  category: string
  status: string
  description: string | null
  designerId: string
  designer: string | null
  taskId: string | null
  task: string | null
  createdAt: string
  updatedAt: string
  files: number
}

export interface GraphicsSubmissionDetail extends Omit<GraphicsSubmission, 'files'> {
  designerEmail: string | null
  taskStatus: string | null
  files: Array<{ id: string; originalName: string; fileUrl: string; mimeType: string; fileSize: number }>
  history: Array<{ id: string; type: string; title: string; createdAt: string }>
}

export interface GraphicsConversion {
  id: string
  status: string
  reviewerNote: string | null
  submittedAt: string | null
  updatedAt: string
  submissionId: string
  submission: string
  submissionCategory: string
  designerId: string
  designer: string | null
}

export interface GraphicsConversionDetail extends GraphicsConversion {
  code: string | null
  techNotes: string | null
  submissionStatus: string
  designerEmail: string | null
  files: Array<{ id: string; originalName: string; fileUrl: string; mimeType: string; fileSize: number }>
  history: Array<{ id: string; type: string; title: string; createdAt: string }>
}

function toParams(params: Record<string, string | undefined>) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== 'all') out[k] = v
  }
  return out
}

// --- Designers ---

export async function listGraphicsDesigners(): Promise<GraphicsDesigner[]> {
  const response = await api.get<GraphicsDesigner[]>('/admin/graphics/designers')
  return response.data
}

// --- Tasks (§3) ---

export async function listGraphicsTasks(params: {
  status?: string
  priority?: string
  designerId?: string
  search?: string
} = {}): Promise<GraphicsTask[]> {
  const response = await api.get<GraphicsTask[]>('/admin/graphics/tasks', { params: toParams(params) })
  return response.data
}

export async function getGraphicsTask(id: string): Promise<GraphicsTaskDetail> {
  const response = await api.get<GraphicsTaskDetail>(`/admin/graphics/tasks/${id}`)
  return response.data
}

export async function createGraphicsTask(payload: CreateGraphicsTaskPayload): Promise<GraphicsTask> {
  const response = await api.post<GraphicsTask>('/admin/graphics/tasks', payload)
  return response.data
}

export async function updateGraphicsTask(id: string, payload: UpdateGraphicsTaskPayload): Promise<GraphicsTask> {
  const response = await api.patch<GraphicsTask>(`/admin/graphics/tasks/${id}`, payload)
  return response.data
}

export async function deleteGraphicsTask(id: string): Promise<{ success: boolean }> {
  const response = await api.delete<{ success: boolean }>(`/admin/graphics/tasks/${id}`)
  return response.data
}

// --- Submissions (§4) ---

export async function listGraphicsSubmissions(params: {
  status?: string
  category?: string
  designerId?: string
  search?: string
} = {}): Promise<GraphicsSubmission[]> {
  const response = await api.get<GraphicsSubmission[]>('/admin/graphics/submissions', { params: toParams(params) })
  return response.data
}

export async function getGraphicsSubmission(id: string): Promise<GraphicsSubmissionDetail> {
  const response = await api.get<GraphicsSubmissionDetail>(`/admin/graphics/submissions/${id}`)
  return response.data
}

export async function reviewGraphicsSubmission(
  id: string,
  payload: { status: string; note?: string },
): Promise<GraphicsSubmission> {
  const response = await api.patch<GraphicsSubmission>(`/admin/graphics/submissions/${id}/review`, payload)
  return response.data
}

// --- Image-to-Code (§5) ---

export async function listGraphicsConversions(params: {
  status?: string
  search?: string
} = {}): Promise<GraphicsConversion[]> {
  const response = await api.get<GraphicsConversion[]>('/admin/graphics/image-to-code', { params: toParams(params) })
  return response.data
}

export async function getGraphicsConversion(id: string): Promise<GraphicsConversionDetail> {
  const response = await api.get<GraphicsConversionDetail>(`/admin/graphics/image-to-code/${id}`)
  return response.data
}

export async function requestGraphicsConversion(submissionId: string): Promise<GraphicsConversion> {
  const response = await api.post<GraphicsConversion>('/admin/graphics/image-to-code', { submissionId })
  return response.data
}

export async function backfillGraphicsConversions(): Promise<{ created: number; checked: number }> {
  const response = await api.post<{ created: number; checked: number }>('/admin/graphics/image-to-code/backfill')
  return response.data
}

export async function reviewGraphicsConversion(
  id: string,
  payload: { status: string; note?: string },
): Promise<GraphicsConversion> {
  const response = await api.patch<GraphicsConversion>(`/admin/graphics/image-to-code/${id}/review`, payload)
  return response.data
}
