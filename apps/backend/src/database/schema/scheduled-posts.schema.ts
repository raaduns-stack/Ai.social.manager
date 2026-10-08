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
import { submissions } from './submissions.schema';

export const scheduledPostStatusEnum = pgEnum('scheduled_post_status', [
  'SCHEDULED',
  'PROCESSING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
]);

export const scheduledPosts = pgTable('scheduled_posts', {
  scheduledPostId: uuid('scheduled_post_id').primaryKey().defaultRandom(),
  calendarPostId: uuid('calendar_post_id').notNull().unique(),
  variationId: uuid('variation_id').notNull().unique(),
  socialAccountId: uuid('social_account_id').notNull(),
  platform: varchar('platform', { length: 255 }).notNull(),
  content: text('content').notNull(),
  mediaUrl: varchar('media_url', { length: 2048 }),
  designerSubmissionId: uuid('designer_submission_id').references(() => submissions.id, {
    onDelete: 'set null',
  }),
  hasDesignerAsset: boolean('has_designer_asset').notNull().default(false),
  retryCount: integer('retry_count').notNull().default(0),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: scheduledPostStatusEnum('status').notNull().default('SCHEDULED'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  designerSubmission: one(submissions, {
    fields: [scheduledPosts.designerSubmissionId],
    references: [submissions.id],
  }),
}));

export type ScheduledPostRow = typeof scheduledPosts.$inferSelect;
export type NewScheduledPostRow = typeof scheduledPosts.$inferInsert;
