export interface User {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  role: 'client' | 'designer' | 'reviewer' | 'account_manager' | 'super_admin';
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PlanFeature {
  channels: number;
  posts: number;
  [key: string]: any;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number; // in cents
  interval: 'monthly' | 'yearly';
  features: PlanFeature | Record<string, any>;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  currentPeriodStart: Date | string;
  currentPeriodEnd?: Date | string | null;
  cancelledAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'verified' | 'failed' | string;
  date: Date | string;
  method: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string | null;
  amount: number | string;
  currency?: string;
  status: 'Paid' | 'Processing' | 'Failed' | 'Pending' | string;
  date: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiErrorResponse {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[] | object;
}

export type UploadCategory =
  | 'business_assets'
  | 'staff_images'
  | 'office_view'
  | 'products'
  | 'events'
  | 'business_documents';

export type UploadStatus = 'pending' | 'approved' | 'rejected';

export interface Upload {
  id: string;
  userId: string;
  category: UploadCategory;
  originalName: string;
  storedName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  status?: UploadStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Present only on admin responses — the customer who uploaded the file
  user?: {
    id: string;
    fullName: string;
    email: string;
    businessName: string | null;
  };
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  businessDescription?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SystemSettings {
  id: string;
  defaultTimezone?: string | null;
  defaultCurrency?: string | null;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  freeTrialDays: number;
  maxSocialAccountsPerCustomer: number;
  contentApprovalRequired: boolean;
  dateFormat?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface NotificationTypeSettings {
  id: string;
  notificationType: string;
  emailAvailable: boolean;
  inAppAvailable: boolean;
  whatsappAvailable: boolean;
  isEnabledGlobally: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface NotificationPreference {
  notificationType: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  whatsappEnabled: boolean;
  emailAvailable: boolean;
  inAppAvailable: boolean;
  whatsappAvailable: boolean;
}

export interface EmailConfig {
  id: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPasswordMasked?: string | null;
  smtpSecure: boolean;
  senderName?: string | null;
  senderEmail?: string | null;
  replyToEmail?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SocialApiSetting {
  id: string | null;
  platform: string;
  clientId?: string | null;
  clientSecretMasked?: string | null;
  redirectUri?: string | null;
  isEnabled: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface PaymentGatewaySettings {
  id: string;
  publicKey?: string | null;
  secretKeyMasked?: string | null;
  webhookSecretMasked?: string | null;
  supportedMethods: string[];
  isLiveMode: boolean;
  isEnabled: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CustomerCompanyProfile {
  id: string | null;
  userId: string;
  businessName: string;
  businessDescription?: string | null;
  industry?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export type ScheduledPostStatus = 'SCHEDULED' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export interface ScheduledPost {
  scheduledPostId: string;
  calendarPostId: string;
  variationId: string;
  socialAccountId: string;
  platform: string;
  content: string;
  mediaUrl: string | null;
  scheduledAt: string;
  status: ScheduledPostStatus;
  idempotencyKey: string | null;
}

export interface PublishingLogEntry {
  scheduledPostId: string;
  status: 'PUBLISHED' | 'FAILED';
  externalPostId: string | null;
  error: string | null;
  attemptedAt: string;
}

