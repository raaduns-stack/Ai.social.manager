import { pgTable, uuid, varchar, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { tasks } from './tasks.schema';

export const submissionStatusEnum = pgEnum('submission_status', [
  'draft',
  'submitted',
  'received',
  'under_review',
  'revision_required',
  'resubmitted',
  'approved',
  'completed',
]);

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),

  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('General Graphics'),
  description: text('description'),
  status: submissionStatusEnum('status').notNull().default('draft'),

  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const submissionFiles = pgTable('submission_files', {
  id: uuid('id').primaryKey().defaultRandom(),

  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),

  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const submissionActivities = pgTable('submission_activities', {
  id: uuid('id').primaryKey().defaultRandom(),

  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),

  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),

  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  designer: one(users, {
    fields: [submissions.designerId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [submissions.taskId],
    references: [tasks.id],
  }),
  files: many(submissionFiles),
  activities: many(submissionActivities),
}));

export const submissionFilesRelations = relations(submissionFiles, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionFiles.submissionId],
    references: [submissions.id],
  }),
}));

export const submissionActivitiesRelations = relations(submissionActivities, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionActivities.submissionId],
    references: [submissions.id],
  }),
  user: one(users, {
    fields: [submissionActivities.userId],
    references: [users.id],
  }),
}));

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionFile = typeof submissionFiles.$inferSelect;
export type NewSubmissionFile = typeof submissionFiles.$inferInsert;
export type SubmissionActivity = typeof submissionActivities.$inferSelect;
export type NewSubmissionActivity = typeof submissionActivities.$inferInsert;
