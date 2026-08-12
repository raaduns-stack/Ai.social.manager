import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

/**
 * activity_logs — records administrative and user actions across the platform.
 *
 * Every significant operation performed through the admin panel or by a logged-in
 * user should call ActivityLogsService.record() to append an entry here.
 *
 * Sensitive fields (passwords, tokens, raw PII) must never appear in `description`.
 */
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * The user who performed the action. Nullable: system-generated events have
     * no actor. onDelete: 'set null' preserves history even after account deletion.
     */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    /** Display name snapshot taken at write time (survives user deletion). */
    userName: varchar('user_name', { length: 255 }),

    /** Short verb-phrase label for the action, e.g. "Created User". */
    action: varchar('action', { length: 100 }).notNull(),

    /**
     * The area of the platform the action belongs to.
     * Matches the filter values shown in the frontend UI:
     * Users | Billing | AI Management | Staff | Calendar | System
     */
    module: varchar('module', { length: 100 }).notNull(),

    /**
     * Human-readable explanation of what happened.
     * Must NOT contain passwords, tokens, or other secrets.
     */
    description: text('description').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_user_id_idx').on(table.userId),
    index('activity_logs_module_idx').on(table.module),
    index('activity_logs_created_at_idx').on(table.createdAt),
  ],
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
