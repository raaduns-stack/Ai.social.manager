import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const scheduledPostStatusEnum = pgEnum('scheduled_post_status', [
  'SCHEDULED',
  'PROCESSING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
]);

export const scheduledPosts = pgTable('scheduled_posts', {
  scheduledPostId: uuid('scheduled_post_id').primaryKey().defaultRandom(),
  calendarPostId: uuid('calendar_post_id').notNull(),
  variationId: uuid('variation_id').notNull(),
  socialAccountId: uuid('social_account_id').notNull(),
  platform: varchar('platform', { length: 255 }).notNull(),
  content: text('content').notNull(),
  mediaUrl: varchar('media_url', { length: 2048 }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: scheduledPostStatusEnum('status').notNull().default('SCHEDULED'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ScheduledPostRow = typeof scheduledPosts.$inferSelect;
export type NewScheduledPostRow = typeof scheduledPosts.$inferInsert;
