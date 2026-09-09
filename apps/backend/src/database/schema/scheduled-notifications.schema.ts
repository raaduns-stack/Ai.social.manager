import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import {
  notificationTypeEnum,
  notificationChannelEnum,
  notificationPriorityEnum,
} from './notifications.schema';
import { NotificationPriority, ScheduledNotificationStatus } from '../../common/enums';

export const scheduledNotificationStatusEnum = pgEnum('scheduled_notification_status', ScheduledNotificationStatus);

export const scheduledNotifications = pgTable('scheduled_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id')
    .references(() => users.id, { onDelete: 'set null' }),
  type: notificationTypeEnum('type').notNull(),
  channel: notificationChannelEnum('channel').notNull(),
  priority: notificationPriorityEnum('priority').notNull().default(NotificationPriority.NORMAL),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  repeatInterval: varchar('repeat_interval', { length: 50 }),
  repeatUntil: timestamp('repeat_until'),
  status: scheduledNotificationStatusEnum('status').notNull().default(ScheduledNotificationStatus.PENDING),
  lastAttemptedAt: timestamp('last_attempted_at'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type NewScheduledNotification = typeof scheduledNotifications.$inferInsert;
