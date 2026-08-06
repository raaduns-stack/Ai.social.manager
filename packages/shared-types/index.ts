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

export interface Upload {
  id: string;
  userId: string;
  category: UploadCategory;
  originalName: string;
  storedName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

