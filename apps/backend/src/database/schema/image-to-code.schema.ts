import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { submissions } from './submissions.schema';

export const imageToCodeStatusEnum = pgEnum('image_to_code_status', [
  'not_started',
  'draft',
  'submitted',
  'revision_required',
  'accepted',
]);

export const imageToCode = pgTable('image_to_code', {
  id: uuid('id').primaryKey().defaultRandom(),

  submissionId: uuid('submission_id')
    .notNull()
    .unique()
    .references(() => submissions.id, { onDelete: 'cascade' }),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  status: imageToCodeStatusEnum('status').notNull().default('not_started'),
  code: text('code'),
  techNotes: text('tech_notes'),

  submittedAt: timestamp('submitted_at'),
  reviewerNote: text('reviewer_note'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const imageToCodeRelations = relations(imageToCode, ({ one }) => ({
  submission: one(submissions, {
    fields: [imageToCode.submissionId],
    references: [submissions.id],
  }),
  designer: one(users, {
    fields: [imageToCode.designerId],
    references: [users.id],
  }),
}));

export type ImageToCodeConversion = typeof imageToCode.$inferSelect;
export type NewImageToCodeConversion = typeof imageToCode.$inferInsert;
