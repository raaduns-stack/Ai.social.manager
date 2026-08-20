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

// ─── AI Calendar Generation ────────────────────────────────────────────────────

export interface GenerateCalendarRequestDto {
  /** Target month in YYYY-MM format */
  month: string
  /** At least one platform must be supplied */
  platforms: Platform[]
}

export type GenerationJobStatus = 'PENDING' | 'GENERATING' | 'GENERATED' | 'FAILED'

export interface GenerationJob {
  id: string
  status: GenerationJobStatus
  month: string
  createdAt: string
  updatedAt: string
}

export interface CalendarUsage {
  month: string
  plan: string
  monthlyLimit: number
  monthlyUsed: number
  monthlyRemaining: number
  weeklyLimit: number
}

// ─── Customer API ──────────────────────────────────────────────────────────────

/**
 * Fetch monthly calendar usage and plan limits for the authenticated user.
 */
export async function getCalendarUsage(userId: string, month?: string): Promise<CalendarUsage> {
  const params: Record<string, string> = { userId }
  if (month) params.month = month
  const res = await api.get<CalendarUsage>('/calendar/usage', { params })
  return res.data
}

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
 * Update an existing scheduled post for the authenticated user.
 */
export async function updateCalendarPost(id: string, dto: Partial<CalendarPost>): Promise<CalendarPost> {
  const res = await api.patch<CalendarPost>(`/calendar/posts/${id}`, dto)
  return res.data
}

/**
 * Trigger the AI calendar generation workflow for the authenticated user.
 * The backend creates a generation job and fires the n8n webhook — no secrets
 * are ever passed through the browser.
 *
 * @param month - Target month in "YYYY-MM" format (e.g. "2026-09")
 * @param platforms - One or more platform names to generate posts for
 */
export async function generateAICalendar(
  month: string,
  platforms: Platform[],
): Promise<GenerationJob> {
  const res = await api.post<GenerationJob>('/calendar/generate', { month, platforms })
  return res.data
}

/**
 * Poll the status of an AI calendar generation job.
 * Returns the current status: PENDING | GENERATING | GENERATED | FAILED.
 */
export async function getGenerationJobStatus(jobId: string): Promise<GenerationJob> {
  const res = await api.get<GenerationJob>(`/calendar/generation/${jobId}`)
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
