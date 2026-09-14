export interface MonthlyEarning {
  m: string
  v: number
}

export interface DashboardRecentSubmission {
  id: string
  title: string
  status: string
  category: string
  updated: string
  progress: number
}

export interface DashboardAttentionItem {
  id: string
  title: string
  reason: string
}

export interface DashboardUpcomingTask {
  id: string
  title: string
  dueDate: string | null
  priority: string
}

export interface DesignerDashboardSummary {
  totalSubmissions: number
  approvalRate: number
  totalEarned: number
  pendingEarnings: number
  lastPaidAmount: number
  monthlyEarnings: MonthlyEarning[]
  statusCounts: Record<string, number>
  recentSubmissions: DashboardRecentSubmission[]
  attentionItems: DashboardAttentionItem[]
  upcomingTasks: DashboardUpcomingTask[]
}

export interface DesignerProfile {
  fullName: string
  email: string
  businessName: string | null
  phone: string | null
  avatar: string | null
  bio: string | null
  portfolioUrl: string | null
  specialties: string[]
}

export interface UpdateProfilePayload {
  fullName?: string
  businessName?: string
  phone?: string
  avatar?: string
  bio?: string
  portfolioUrl?: string
  specialties?: string[]
}

export interface DesignerTask {
  id: string
  title: string
  brief: string | null
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  status: 'open' | 'in_progress' | 'done'
  assignedTo: string
  assignedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface SubmissionFile {
  id: string
  submissionId: string
  originalName: string
  storedName: string
  fileUrl: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export interface DesignerSubmission {
  id: string
  title: string
  category: string
  description: string | null
  status: string
  taskId: string | null
  designerId: string
  createdAt: string
  updatedAt: string
  files: number
}

export interface DesignerSubmissionDetail extends Omit<DesignerSubmission, 'files'> {
  files: SubmissionFile[]
}

export interface SubmissionActivity {
  id: string
  submissionId: string
  type: string
  title: string
  userId: string | null
  createdAt: string
}

export interface DesignerPayment {
  id: string
  designerId: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  period: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DesignerPaymentMethod {
  id: string
  designerId: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdatePaymentMethodPayload {
  bankName: string
  accountNumber: string
  accountName: string
}

export interface DesignerNotification {
  id: string
  designerId: string
  type: 'task' | 'revision' | 'approved' | 'payment' | 'system'
  title: string
  message: string | null
  read: boolean
  createdAt: string
}

export interface DesignerNotificationPrefs {
  tasks: boolean
  submissions: boolean
  revisions: boolean
  payments: boolean
  email: boolean
  digest: 'instant' | 'daily' | 'weekly'
}

export interface UpdateNotificationPrefsPayload {
  tasks?: boolean
  submissions?: boolean
  revisions?: boolean
  payments?: boolean
  email?: boolean
  digest?: 'instant' | 'daily' | 'weekly'
}

export interface ImageToCodeConversion {
  id: string
  status: 'not_started' | 'draft' | 'submitted' | 'revision_required' | 'accepted'
  code: string | null
  techNotes: string | null
  submittedAt: string | null
  reviewerNote: string | null
  updatedAt: string
  submissionId: string
  submissionTitle: string
  submissionCategory: string
}

export interface UpdateImageToCodePayload {
  code?: string
  techNotes?: string
}
