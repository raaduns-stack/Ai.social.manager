import api from '../../lib/api-client'

export interface ChangePasswordResponse {
  message: string
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  const response = await api.patch<ChangePasswordResponse>('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

