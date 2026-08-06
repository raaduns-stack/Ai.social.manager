import api from '../../lib/api-client'
import { Upload, UploadCategory } from '@socialpilot/shared-types'

// Parameters used when fetching uploads
export interface GetUploadsParams {
  category?: UploadCategory
  limit?: number
  offset?: number
}

// Upload a file along with its metadata to the backend
export async function uploadFile(formData: FormData): Promise<Upload> {
  const response = await api.post<Upload>('/uploads', formData, {
    headers: {
      // Required for file uploads
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// Retrieve all uploads for the authenticated user
// Supports optional filtering and pagination
export async function getUploads(params?: GetUploadsParams): Promise<Upload[]> {
  const response = await api.get<Upload[]>('/uploads', { params })
  return response.data
}

// Retrieve a single upload by its ID
export async function getUpload(id: string): Promise<Upload> {
  const response = await api.get<Upload>(`/uploads/${id}`)
  return response.data
}

// Update an upload (currently its category)
export async function updateUpload(
  id: string,
  data: { category?: UploadCategory }
): Promise<Upload> {
  const response = await api.patch<Upload>(`/uploads/${id}`, data)
  return response.data
}

// Delete an upload by its ID
export async function deleteUpload(id: string): Promise<void> {
  const response = await api.delete<void>(`/uploads/${id}`)
  return response.data
}
