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

  // ---- Section 1 — Business Information ----
  businessName: varchar('business_name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  businessType: varchar('business_type', { length: 100 }).notNull(),
  businessAddress: text('business_address').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  businessEmail: varchar('business_email', { length: 255 }).notNull(),
  businessPhone: varchar('business_phone', { length: 50 }).notNull(),
  businessDescription: text('business_description').notNull(),

  // ---- Section 2 — Verification Documents ----
  // Each field stores the server-relative file path (storedName from the
  // uploads table) so admins can download via GET /kyc/:id/document/:doc.
  // We store ONLY the filename (not the full URL) so path changes don't break records.
  certOfRegistrationPath: varchar('cert_of_registration_path', { length: 500 }),
  utilityBillPath: varchar('utility_bill_path', { length: 500 }),
  ownerIdPath: varchar('owner_id_path', { length: 500 }),

  // ---- Review tracking ----
  status: kycStatusEnum('status').notNull().default('pending'),

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
}));

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------
export type Kyc = typeof kyc.$inferSelect;
export type NewKyc = typeof kyc.$inferInsert;
