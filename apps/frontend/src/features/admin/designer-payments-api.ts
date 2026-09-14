import api from '../../lib/api-client';

export interface DesignerPaymentSettings {
  id: string;
  perImageAmount: number; // in kobo
  perImageToCodeAmount: number; // in kobo
  payoutSchedule: 'weekly' | 'monthly';
  payoutDayOfWeek: number; // 1-7
  payoutDayOfMonth: number; // 1-28
  manualPayoutFeePercent: number; // e.g. 2
  createdAt: string;
  updatedAt: string;
}

export interface DesignerPaymentsDashboardStats {
  totalDesignerEarnings: number;
  pendingPayments: number;
  processedPayments: number;
  outstandingPayments: number;
  totalDesigners: number;
  pendingPayoutsCount: number;
  processedPayoutsCount: number;
  totalPayoutRecordsCount: number;
  settings: {
    perImageAmount: number;
    perImageToCodeAmount: number;
    payoutSchedule: 'weekly' | 'monthly';
    payoutDayOfWeek: number;
    payoutDayOfMonth: number;
    manualPayoutFeePercent: number;
  };
  schedule: {
    description: string;
    nextDate: string;
    isTodayGlobalPayout: boolean;
    feeNotice: string;
  };
}

export interface DesignerEarningsItem {
  designerId: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  phoneNumber: string | null;
  accountStatus: string;
  createdAt: string;

  approvedImagesCount: number;
  acceptedImageToCodeCount: number;
  pendingImagesCount: number;
  pendingImageToCodeCount: number;

  approvedEarnings: number;
  pendingEarnings: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingPayouts: number;
  outstandingBalance: number;

  paymentMethod: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
}

export interface DesignerPaymentRecord {
  id: string;
  designerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'successful' | 'paid' | 'failed' | 'declined';
  period: string | null;
  reference: string;
  payoutType: 'manual' | 'global';
  fee: number;
  netAmount: number;
  relatedWork: string | null;
  notes: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  designerName: string;
  designerEmail: string;
  designerProfileImage: string | null;
}

export async function getDesignerPaymentDashboard(): Promise<DesignerPaymentsDashboardStats> {
  const response = await api.get<DesignerPaymentsDashboardStats>('/admin/designer-payments/dashboard');
  return response.data;
}

export async function getDesignerEarnings(): Promise<DesignerEarningsItem[]> {
  const response = await api.get<DesignerEarningsItem[]>('/admin/designer-payments/earnings');
  return response.data;
}

export async function getDesignerPaymentRecords(params?: {
  status?: string;
  search?: string;
  designerId?: string;
}): Promise<DesignerPaymentRecord[]> {
  const response = await api.get<DesignerPaymentRecord[]>('/admin/designer-payments/records', { params });
  return response.data;
}

export async function createDesignerPayout(payload: {
  designerId: string;
  amount: number;
  payoutType: 'manual' | 'global';
  period?: string;
  relatedWork?: string;
  notes?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}): Promise<DesignerPaymentRecord> {
  const response = await api.post<DesignerPaymentRecord>('/admin/designer-payments/records', payload);
  return response.data;
}

export async function updateDesignerPaymentStatus(
  id: string,
  payload: {
    status: 'pending' | 'approved' | 'processing' | 'successful' | 'paid' | 'failed' | 'declined';
    notes?: string;
  },
): Promise<DesignerPaymentRecord> {
  const response = await api.patch<DesignerPaymentRecord>(`/admin/designer-payments/records/${id}/status`, payload);
  return response.data;
}

export async function getDesignerPaymentSettings(): Promise<DesignerPaymentSettings> {
  const response = await api.get<DesignerPaymentSettings>('/admin/designer-payments/settings');
  return response.data;
}

export async function updateDesignerPaymentSettings(payload: {
  perImageAmount: number;
  perImageToCodeAmount: number;
  payoutSchedule: 'weekly' | 'monthly';
  payoutDayOfWeek: number;
  payoutDayOfMonth: number;
  manualPayoutFeePercent?: number;
}): Promise<DesignerPaymentSettings> {
  const response = await api.put<DesignerPaymentSettings>('/admin/designer-payments/settings', payload);
  return response.data;
}

export async function deleteDesignerPaymentRecord(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/designer-payments/records/${id}`);
  return response.data;
}
