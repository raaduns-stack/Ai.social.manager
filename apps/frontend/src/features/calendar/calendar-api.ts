/**
 * calendar-api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All API calls for the Content Calendar feature.
 * Uses the shared apiClient (Axios) which automatically attaches the
 * Bearer token from useAuthStore for customer routes, and from
 * localStorage admin_session for admin routes.
 *
 * Field names match the Drizzle $inferSelect shape from content-calendar.schema.ts:
 *   id, userId, title, caption, platform, status, approvalStatus,
 *   adminNotes, scheduledAt, publishedAt, mediaUrl, hashtags,
 *   aiGenerated, createdAt, updatedAt
 *   + user: { fullName, businessName, email } on admin-joined responses
 * ─────────────────────────────────────────────────────────────────────────────
 */
import api from '../../lib/api-client'

// ─── Shared types ──────────────────────────────────────────────────────────────

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'
export type Platform = 'Instagram' | 'LinkedIn' | 'X / Twitter' | 'TikTok' | 'Facebook'

export interface CalendarPost {
  id: string
  userId: string
  title: string
  caption: string
  platform: Platform
  status: PostStatus
  approvalStatus: ApprovalStatus
  adminNotes: string | null
  scheduledAt: string | null   // ISO 8601 timestamp string from DB
  publishedAt: string | null
  mediaUrl: string | null
  hashtags: string[]
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  // Present on admin routes due to `with: { user }` join
  user?: {
    fullName: string
    businessName: string | null
    email: string
  }
}

export interface CustomerSummary {
  userId: string
  fullName: string
  businessName: string | null
  email: string
  postCount: number
  pendingCount: number
}

export interface AdminOverview {
  total: number
  pending: number
  approved: number
  rejected: number
  revisionRequired: number
}

export interface CreatePostDto {
  title: string
  caption: string
  platform: Platform
  scheduledAt?: string   // ISO 8601
  mediaUrl?: string
  hashtags?: string[]
  aiGenerated?: boolean
}

export interface UpdateApprovalDto {
  approvalStatus: ApprovalStatus
  adminNotes?: string
}

// ─── Customer API ──────────────────────────────────────────────────────────────

/**
 * Fetch all calendar posts for the authenticated user.
 * Optionally filter by status (DRAFT | SCHEDULED | PUBLISHED | ALL).
 * The userId is passed as a query param until the backend JWT guard is wired.
 */
export async function getCalendarPosts(userId: string, status?: string): Promise<CalendarPost[]> {
  const params: Record<string, string> = { userId }
  if (status && status !== 'ALL') params.status = status
  const res = await api.get<CalendarPost[]>('/calendar/posts', { params })
  return res.data
}

/**
 * Fetch only SCHEDULED (upcoming) posts for the authenticated user.
 */
export async function getUpcomingPosts(userId: string): Promise<CalendarPost[]> {
  const res = await api.get<CalendarPost[]>('/calendar/posts/upcoming', { params: { userId } })
  return res.data
}

/**
 * Fetch only PUBLISHED posts for the authenticated user.
 */
export async function getPublishedPosts(userId: string): Promise<CalendarPost[]> {
  const res = await api.get<CalendarPost[]>('/calendar/posts/published', { params: { userId } })
  return res.data
}

/**
 * Fetch a single calendar post by ID, validated against the user's ownership.
 */
export async function getCalendarPost(id: string, userId: string): Promise<CalendarPost> {
  const res = await api.get<CalendarPost>(`/calendar/posts/${id}`, { params: { userId } })
  return res.data
}

/**
 * Create a new scheduled post for the authenticated user.
 */
export async function createCalendarPost(userId: string, dto: CreatePostDto): Promise<CalendarPost> {
  const res = await api.post<CalendarPost>('/calendar/posts', dto, { params: { userId } })
  return res.data
}

/**
 * Delete a calendar post owned by the authenticated user.
 */
export async function deleteCalendarPost(id: string, userId: string): Promise<void> {
  await api.delete(`/calendar/posts/${id}`, { params: { userId } })
}

// ─── Admin API ─────────────────────────────────────────────────────────────────

/**
 * Fetch all customers who have at least one calendar post.
 * Used by the admin Content Calendar overview page.
 */
export async function getCalendarCustomers(): Promise<CustomerSummary[]> {
  const res = await api.get<CustomerSummary[]>('/calendar/admin/customers')
  return res.data
}

/**
 * Fetch all calendar posts for a specific customer (admin view).
 * Optionally filter by approvalStatus.
 */
export async function getAdminCalendarPosts(
  userId?: string,
  approvalStatus?: string,
): Promise<CalendarPost[]> {
  const params: Record<string, string> = {}
  if (userId) params.userId = userId
  if (approvalStatus && approvalStatus !== 'ALL') params.approvalStatus = approvalStatus
  const res = await api.get<CalendarPost[]>('/calendar/admin/posts', { params })
  return res.data
}

/**
 * Get approval status metrics for all users or a specific user (admin overview).
 */
export async function getAdminOverview(userId?: string): Promise<AdminOverview> {
  const params: Record<string, string> = {}
  if (userId) params.userId = userId
  const res = await api.get<AdminOverview>('/calendar/admin/overview', { params })
  return res.data
}

/**
 * Update approval status (and optional admin notes) on a calendar post.
 * This is the admin approval action — PATCH /calendar/admin/posts/:id/approval
 */
export async function updatePostApproval(id: string, dto: UpdateApprovalDto): Promise<CalendarPost> {
  const res = await api.patch<CalendarPost>(`/calendar/admin/posts/${id}/approval`, dto)
  return res.data
}
