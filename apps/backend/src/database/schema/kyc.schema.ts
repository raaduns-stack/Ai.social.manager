/**
 * kyc.schema.ts
 * ---------------------------------------------------------------------------
 * KYC (Know Your Customer) table — one row per business user.
 *
 * A user must have an APPROVED kyc record before they can connect any
 * social-media account. The status lifecycle is:
 *   (none) → pending → approved
 *                    ↘ rejected → pending (re-submission)
 *
 * Documents are stored as file URLs pointing to the existing /uploads disk
 * storage, so we piggy-back on the proven MulterModule infrastructure.
 * ---------------------------------------------------------------------------
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

// ---------------------------------------------------------------------------
// KYC status enum
// ---------------------------------------------------------------------------
export const kycStatusEnum = pgEnum('kyc_status', [
  'pending',    // submitted, awaiting admin review
  'approved',   // admin approved — user may connect social accounts
  'rejected',   // admin rejected — user must correct and resubmit
  'resubmission_required', // admin requested resubmission
]);

// ---------------------------------------------------------------------------
// Main KYC table
// ---------------------------------------------------------------------------
export const kyc = pgTable('kyc', {
  id: uuid('id').primaryKey().defaultRandom(),

  // One KYC record per user (unique enforced at service layer via upsert)
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  parentId: uuid('parent_id'),
  isUpdateRequest: boolean('is_update_request').notNull().default(false),

  // ---- Section 1 — Business Information ----
  businessName: varchar('business_name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  businessType: varchar('business_type', { length: 100 }).notNull(),
  businessAddress: text('business_address').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  businessEmail: varchar('business_email', { length: 255 }).notNull(),
  businessPhone: varchar('business_phone', { length: 50 }).notNull(),
  businessDescription: text('business_description').notNull(),

  // ---- Section 2 — Verification Documents & Metadata ----
  certOfRegistrationPath: varchar('cert_of_registration_path', { length: 500 }),
  certOfRegistrationOriginalName: varchar('cert_of_registration_original_name', { length: 255 }),
  certOfRegistrationMimeType: varchar('cert_of_registration_mime_type', { length: 100 }),
  certOfRegistrationFileSize: integer('cert_of_registration_file_size'),
  certOfRegistrationUploadedAt: timestamp('cert_of_registration_uploaded_at'),

  utilityBillPath: varchar('utility_bill_path', { length: 500 }),
  utilityBillOriginalName: varchar('utility_bill_original_name', { length: 255 }),
  utilityBillMimeType: varchar('utility_bill_mime_type', { length: 100 }),
  utilityBillFileSize: integer('utility_bill_file_size'),
  utilityBillUploadedAt: timestamp('utility_bill_uploaded_at'),

  ownerIdPath: varchar('owner_id_path', { length: 500 }),
  ownerIdOriginalName: varchar('owner_id_original_name', { length: 255 }),
  ownerIdMimeType: varchar('owner_id_mime_type', { length: 100 }),
  ownerIdFileSize: integer('owner_id_file_size'),
  ownerIdUploadedAt: timestamp('owner_id_uploaded_at'),

  // ---- Review tracking ----
  status: kycStatusEnum('status').notNull().default('pending'),

  // Individual document verification status and reasons
  certOfRegistrationStatus: varchar('cert_of_registration_status', { length: 50 }).notNull().default('pending'),
  certOfRegistrationRejectionReason: text('cert_of_registration_rejection_reason'),

  utilityBillStatus: varchar('utility_bill_status', { length: 50 }).notNull().default('pending'),
  utilityBillRejectionReason: text('utility_bill_rejection_reason'),

  ownerIdStatus: varchar('owner_id_status', { length: 50 }).notNull().default('pending'),
  ownerIdRejectionReason: text('owner_id_rejection_reason'),

  // Admin user who last reviewed this record (null until reviewed)
  reviewedBy: uuid('reviewed_by'),

  reviewedAt: timestamp('reviewed_at'),

  // Populated only when status = 'rejected' to tell the user why
  rejectionReason: text('rejection_reason'),

  // Timestamps
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Drizzle relations
// ---------------------------------------------------------------------------
export const kycRelations = relations(kyc, ({ one }) => ({
  user: one(users, {
    fields: [kyc.userId],
    references: [users.id],
  }),
  parent: one(kyc, {
    fields: [kyc.parentId],
    references: [kyc.id],
    relationName: 'kyc_parent_child',
  }),
}));

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------
export type Kyc = typeof kyc.$inferSelect;
export type NewKyc = typeof kyc.$inferInsert;
