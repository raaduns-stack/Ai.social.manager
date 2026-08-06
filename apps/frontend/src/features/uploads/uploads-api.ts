import api from '../../lib/api-client'
import { Upload, UploadCategory } from '@socialpilot/shared-types'

export interface GetUploadsParams {
  category?: UploadCategory
  limit?: number
  offset?: number
}

export async function uploadFile(formData: FormData): Promise<Upload> {
  const response = await api.post<Upload>('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}


export async function getUploads(params?: GetUploadsParams): Promise<Upload[]> {
  const response = await api.get<Upload[]>('/uploads', { params })
  return response.data
}

export async function getUpload(id: string): Promise<Upload> {
  const response = await api.get<Upload>(`/uploads/${id}`)
  return response.data
}

export async function updateUpload(id: string, data: { category?: UploadCategory }): Promise<Upload> {
  const response = await api.patch<Upload>(`/uploads/${id}`, data)
  return response.data
}

export async function deleteUpload(id: string): Promise<void> {
  const response = await api.delete<void>(`/uploads/${id}`)
  return response.data
}
