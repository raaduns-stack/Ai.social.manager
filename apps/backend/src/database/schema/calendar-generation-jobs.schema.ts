import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  json,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const calendarJobStatusEnum = pgEnum('calendar_job_status', [
  'PENDING',
  'GENERATING',
  'GENERATED',
  'FAILED',
  'TIMED_OUT',
]);

export const calendarGenerationJobs = pgTable('calendar_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
  platforms: json('platforms').$type<string[]>().default([]).notNull(),
  status: calendarJobStatusEnum('status').notNull().default('PENDING'),
  errorInfo: text('error_info'),
  resultIds: json('result_ids').$type<string[]>().default([]),
  expectedPostCount: integer('expected_post_count'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const calendarGenerationJobsRelations = relations(
  calendarGenerationJobs,
  ({ one }) => ({
    user: one(users, {
      fields: [calendarGenerationJobs.userId],
      references: [users.id],
    }),
  }),
);

export type CalendarGenerationJob = typeof calendarGenerationJobs.$inferSelect;
export type NewCalendarGenerationJob = typeof calendarGenerationJobs.$inferInsert;
