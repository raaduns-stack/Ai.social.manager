import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { UploadCategory } from '../../common/enums/upload-category.enum';
import { UploadStatus } from '../../common/enums/upload-status.enum';

export const uploadCategoryEnum = pgEnum('upload_category', [
  UploadCategory.BUSINESS_ASSETS,
  UploadCategory.STAFF_IMAGES,
  UploadCategory.OFFICE_VIEW,
  UploadCategory.PRODUCTS,
  UploadCategory.EVENTS,
  UploadCategory.BUSINESS_DOCUMENTS,
]);

// Moderation status for the Admin Uploads review queue
export const uploadStatusEnum = pgEnum('upload_status', [
  UploadStatus.PENDING,
  UploadStatus.APPROVED,
  UploadStatus.REJECTED,
]);

export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  category: uploadCategoryEnum('category').notNull(),

  originalName: varchar('original_name', { length: 255 }).notNull(),

  storedName: varchar('stored_name', { length: 255 }).notNull(),

  fileUrl: varchar('file_url', { length: 500 }).notNull(),

  mimeType: varchar('mime_type', { length: 100 }).notNull(),

  fileSize: integer('file_size').notNull(),

  description: varchar('description', { length: 500 }).default(''),

  // ---- Admin moderation fields ----
  status: uploadStatusEnum('status').notNull().default(UploadStatus.PENDING),

  // ID of the admin/staff user who approved or rejected this upload
  reviewedBy: uuid('reviewed_by'),

  reviewedAt: timestamp('reviewed_at'),

  // Required when status is 'rejected'; explains why to the customer
  rejectionReason: varchar('rejection_reason', { length: 500 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const uploadsRelations = relations(uploads, ({ one }) => ({
  user: one(users, {
    fields: [uploads.userId],
    references: [users.id],
  }),
}));

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;