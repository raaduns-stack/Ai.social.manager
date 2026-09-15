import api from '../../lib/api-client'

export interface DesignReportsQueryParams {
  timeframe?: 'all' | 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year' | string
  startDate?: string
  endDate?: string
  designerId?: string
  staffId?: string
  category?: string
}

export interface DesignPerformanceSummary {
  totalSubmissions: number
  completed: number
  approved: number
  totalApproved: number
  pendingReviews: number
  revisions: number
  rejected: number
  drafts: number
  approvalRate: number
  revisionRate: number
}

export interface DesignCategoryStat {
  category: string
  total: number
  approved: number
  pending: number
  revisions: number
  percentage: number
}

export interface DesignTimelinePoint {
  date: string
  submitted: number
  approved: number
  revisions: number
}

export interface DesignPerformanceResponse {
  summary: DesignPerformanceSummary
  categories: DesignCategoryStat[]
  timeline: DesignTimelinePoint[]
}

export interface DesignerPerformanceItem {
  designerId: string
  fullName: string
  email: string
  profileImage?: string | null
  phoneNumber?: string | null
  accountStatus?: string | null
  assignmentsCount: number
  submissionsCount: number
  completedCount: number
  approvedCount: number
  revisionCount: number
  rejectionCount: number
  pendingCount: number
  currentWorkload: number
  approvedImagesCount: number
  acceptedI2cCount: number
  approvalRate: number
  completionRate: number
  totalEarned: number
  paidEarnings: number
  pendingPayouts: number
  outstandingBalance: number
}

export interface DesignerPerformanceResponse {
  designers: DesignerPerformanceItem[]
  totals: {
    totalDesigners: number
    totalAssigned: number
    totalSubmissions: number
    totalCompleted: number
    totalWorkload: number
    totalEarned: number
    totalPaid: number
    totalOutstanding: number
  }
}

export interface StaffPerformanceItem {
  staffId: string
  fullName: string
  email: string
  role: string
  profileImage?: string | null
  tasksAssignedCount: number
  reviewsConductedCount: number
  approvalsGivenCount: number
  revisionsRequestedCount: number
  totalActions: number
  recentActivities: Array<{
    id: string
    type: string
    title: string
    createdAt: string
  }>
}

export interface StaffPerformanceResponse {
  staff: StaffPerformanceItem[]
  totals: {
    totalStaff: number
    totalTasksAssigned: number
    totalActivities: number
    totalApprovals: number
    totalRevisions: number
  }
}

export interface PaymentStatusStat {
  count: number
  amount: number
  netAmount: number
  fee: number
}

export interface PaymentEarningsResponse {
  financials: {
    totalDesignerEarnings: number
    processedPayments: number
    pendingPayments: number
    outstandingPayments: number
    totalFeesGenerated: number
    totalPayoutRecords: number
  }
  statusDistribution: Record<string, PaymentStatusStat>
  timeline: Array<{
    date: string
    amount: number
    count: number
    status: string
  }>
  recentPayouts: Array<{
    id: string
    designerId: string
    designerName?: string
    designerEmail?: string
    amount: number
    netAmount: number
    fee: number
    status: string
    payoutType: string
    reference: string
    bankName?: string
    accountNumber?: string
    createdAt: string
    paidAt?: string | null
  }>
  settings: {
    perImageAmount: number
    perImageToCodeAmount: number
    manualPayoutFeePercent: number
    payoutSchedule: string
  }
}

export interface FunnelStage {
  stage: string
  count: number
  color: string
  description: string
}

export interface OperationalWorkflowResponse {
  funnel: FunnelStage[]
  metrics: {
    totalTasks: number
    openTasks: number
    inProgressTasks: number
    completedTasks: number
    totalSubmissions: number
    awaitingReview: number
    inRevision: number
    approvedSubmissions: number
    throughputRate: number
  }
}

export interface DesignOverviewResponse {
  kpis: {
    totalSubmissions: number
    approvedDesigns: number
    pendingReviews: number
    activeWorkload: number
    approvalRate: number
    totalDesigners: number
    totalEarned: number
    totalPaid: number
    outstandingBalance: number
  }
  funnel: FunnelStage[]
  categories: DesignCategoryStat[]
  topDesigners: DesignerPerformanceItem[]
  staffActivityOverview: {
    totalStaff: number
    totalTasksAssigned: number
    totalActivities: number
    totalApprovals: number
    totalRevisions: number
  }
  recentPayouts: any[]
}

export async function getDesignOverview(params?: DesignReportsQueryParams): Promise<DesignOverviewResponse> {
  const response = await api.get<DesignOverviewResponse>('/admin/design-reports/overview', { params })
  return response.data
}

export async function getDesignPerformanceReport(params?: DesignReportsQueryParams): Promise<DesignPerformanceResponse> {
  const response = await api.get<DesignPerformanceResponse>('/admin/design-reports/design-performance', { params })
  return response.data
}

export async function getDesignerPerformanceReport(params?: DesignReportsQueryParams): Promise<DesignerPerformanceResponse> {
  const response = await api.get<DesignerPerformanceResponse>('/admin/design-reports/designer-performance', { params })
  return response.data
}

export async function getStaffPerformanceReport(params?: DesignReportsQueryParams): Promise<StaffPerformanceResponse> {
  const response = await api.get<StaffPerformanceResponse>('/admin/design-reports/staff-performance', { params })
  return response.data
}

export async function getPaymentEarningsReport(params?: DesignReportsQueryParams): Promise<PaymentEarningsResponse> {
  const response = await api.get<PaymentEarningsResponse>('/admin/design-reports/payment-earnings', { params })
  return response.data
}

export async function getOperationalWorkflowReport(params?: DesignReportsQueryParams): Promise<OperationalWorkflowResponse> {
  const response = await api.get<OperationalWorkflowResponse>('/admin/design-reports/operational-workflow', { params })
  return response.data
}
