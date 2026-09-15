import apiClient from '../../lib/api-client';

export interface AdminDesignTask {
  id: string;
  title: string;
  brief: string | null;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'done';
  assignedTo: string;
  assignedBy: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  assigner?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface AdminDesignSubmission {
  id: string;
  title: string;
  category: string;
  description: string | null;
  status: string;
  taskId: string | null;
  designerId: string;
  createdAt: string;
  updatedAt: string;
  designer?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  files?: Array<{
    id: string;
    originalName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }>;
  activities?: Array<{
    id: string;
    type: string;
    title: string;
    userId: string | null;
    createdAt: string;
  }>;
}

export interface CreateTaskPayload {
  title: string;
  brief?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo: string;
}

export interface UpdateTaskPayload {
  title?: string;
  brief?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'open' | 'in_progress' | 'done';
  dueDate?: string;
  assignedTo?: string;
}

export interface ReviewSubmissionPayload {
  status: 'under_review' | 'revision_required' | 'approved' | 'completed';
  notes?: string;
}

// =============================================================================
// API METHODS
// =============================================================================

export async function getAdminDesignTasks(params?: {
  designerId?: string;
  status?: string;
  priority?: string;
}): Promise<AdminDesignTask[]> {
  const res = await apiClient.get('/admin/design-tasks', { params });
  return res.data;
}

export async function createAdminDesignTask(payload: CreateTaskPayload): Promise<AdminDesignTask> {
  const res = await apiClient.post('/admin/design-tasks', payload);
  return res.data;
}

export async function updateAdminDesignTask(id: string, payload: UpdateTaskPayload): Promise<AdminDesignTask> {
  const res = await apiClient.patch(`/admin/design-tasks/${id}`, payload);
  return res.data;
}

export async function deleteAdminDesignTask(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete(`/admin/design-tasks/${id}`);
  return res.data;
}

export async function getAdminDesignSubmissions(params?: {
  designerId?: string;
  status?: string;
  category?: string;
}): Promise<AdminDesignSubmission[]> {
  const res = await apiClient.get('/admin/design-submissions', { params });
  return res.data;
}

export async function getAdminDesignSubmissionDetail(id: string): Promise<AdminDesignSubmission> {
  const res = await apiClient.get(`/admin/design-submissions/${id}`);
  return res.data;
}

export async function reviewAdminDesignSubmission(
  id: string,
  payload: ReviewSubmissionPayload
): Promise<AdminDesignSubmission> {
  const res = await apiClient.patch(`/admin/design-submissions/${id}/review`, payload);
  return res.data;
}
