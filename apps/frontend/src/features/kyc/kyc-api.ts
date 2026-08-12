/**
 * kyc-api.ts
 * ---------------------------------------------------------------------------
 * Frontend API helpers for the KYC feature.
 *
 * Follows the same pattern as features/uploads/uploads-api.ts:
 *   - Uses the shared apiClient (handles JWT auth + token refresh).
 *   - File submissions use FormData with multipart/form-data.
 * ---------------------------------------------------------------------------
 */
import apiClient from '../../lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface KycRecord {
  id: string;
  userId: string;
  businessName: string;
  registrationNumber?: string | null;
  businessType: string;
  businessAddress: string;
  country: string;
  businessEmail: string;
  businessPhone: string;
  businessDescription: string;
  certOfRegistrationPath?: string | null;
  utilityBillPath?: string | null;
  ownerIdPath?: string | null;
  status: KycStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface KycSubmitData {
  businessName: string;
  registrationNumber?: string;
  businessType: string;
  businessAddress: string;
  country: string;
  businessEmail: string;
  businessPhone: string;
  businessDescription: string;
  certOfRegistration?: File | null;
  utilityBill?: File | null;
  ownerId?: File | null;
}

// ---------------------------------------------------------------------------
// Customer-facing API
// ---------------------------------------------------------------------------

/**
 * GET /kyc/me
 * Returns the current user's KYC record or null if none submitted yet.
 */
export async function getMyKyc(): Promise<KycRecord | null> {
  const response = await apiClient.get<KycRecord | null>('/kyc/me');
  return response.data;
}

/**
 * POST /kyc/submit
 * Submit or re-submit KYC form data + document files.
 * Sends as multipart/form-data.
 */
export async function submitKyc(data: KycSubmitData): Promise<KycRecord> {
  const formData = new FormData();

  // Append text fields
  formData.append('businessName', data.businessName);
  if (data.registrationNumber) formData.append('registrationNumber', data.registrationNumber);
  formData.append('businessType', data.businessType);
  formData.append('businessAddress', data.businessAddress);
  formData.append('country', data.country);
  formData.append('businessEmail', data.businessEmail);
  formData.append('businessPhone', data.businessPhone);
  formData.append('businessDescription', data.businessDescription);

  // Append files (only when provided — re-submissions may not re-upload all docs)
  if (data.certOfRegistration) formData.append('certOfRegistration', data.certOfRegistration);
  if (data.utilityBill) formData.append('utilityBill', data.utilityBill);
  if (data.ownerId) formData.append('ownerId', data.ownerId);

  const response = await apiClient.post<KycRecord>('/kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Admin-facing API
// ---------------------------------------------------------------------------

/**
 * GET /admin/kyc
 * List all KYC submissions (admin only).
 */
export async function adminGetAllKyc(): Promise<KycRecord[]> {
  const response = await apiClient.get<KycRecord[]>('/admin/kyc');
  return response.data;
}

/**
 * GET /admin/kyc/:id
 * Get a single KYC submission with full details.
 */
export async function adminGetKyc(id: string): Promise<KycRecord> {
  const response = await apiClient.get<KycRecord>(`/admin/kyc/${id}`);
  return response.data;
}

/**
 * PATCH /admin/kyc/:id/review
 * Approve or reject a KYC submission.
 */
export async function adminReviewKyc(
  id: string,
  data: { status: 'approved' | 'rejected'; rejectionReason?: string },
): Promise<KycRecord> {
  const response = await apiClient.patch<KycRecord>(`/admin/kyc/${id}/review`, data);
  return response.data;
}

/**
 * Builds the URL for downloading a KYC document via the admin endpoint.
 * The download is triggered via the browser using an anchor tag.
 * docType: 'cert' | 'utility' | 'ownerId'
 */
export function adminKycDocumentUrl(kycId: string, docType: 'cert' | 'utility' | 'ownerId'): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
  return `${base}/admin/kyc/${kycId}/document/${docType}`;
}

/**
 * GET /admin/kyc/:id/document/:docType
 * Fetches a KYC document file as a Blob, sending the auth header via apiClient.
 */
export async function adminDownloadKycDocument(
  id: string,
  docType: 'cert' | 'utility' | 'ownerId',
): Promise<Blob> {
  const response = await apiClient.get(`/admin/kyc/${id}/document/${docType}`, {
    responseType: 'blob',
  });
  return response.data;
}
