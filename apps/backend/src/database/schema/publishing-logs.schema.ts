import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { scheduledPosts } from './scheduled-posts.schema';

export const publishingLogStatusEnum = pgEnum('publishing_log_status', [
  'PUBLISHED',
  'FAILED',
]);

export const publishingLogs = pgTable('publishing_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduledPostId: uuid('scheduled_post_id')
    .notNull()
    .references(() => scheduledPosts.scheduledPostId, { onDelete: 'cascade' }),
  status: publishingLogStatusEnum('status').notNull(),
  externalPostId: varchar('external_post_id', { length: 255 }),
  error: text('error'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type PublishingLogRow = typeof publishingLogs.$inferSelect;
export type NewPublishingLogRow = typeof publishingLogs.$inferInsert;
