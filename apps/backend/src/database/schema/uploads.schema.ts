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

export const uploadCategoryEnum = pgEnum('upload_category', [
  UploadCategory.BUSINESS_ASSETS,
  UploadCategory.STAFF_IMAGES,
  UploadCategory.OFFICE_VIEW,
  UploadCategory.PRODUCTS,
  UploadCategory.EVENTS,
  UploadCategory.BUSINESS_DOCUMENTS,
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