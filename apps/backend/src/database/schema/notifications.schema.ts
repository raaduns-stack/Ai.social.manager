import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum';
import { NotificationPriority } from '../../common/enums/notification-priority.enum';

export const notificationTypeEnum = pgEnum('notification_type', NotificationType);

export const notificationChannelEnum = pgEnum('notification_channel', NotificationChannel);

export const deliveryStatusEnum = pgEnum('delivery_status', DeliveryStatus);

export const notificationPriorityEnum = pgEnum('notification_priority', NotificationPriority);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .references(() => users.id, { onDelete: 'set null' }),
  type: notificationTypeEnum('type').notNull(),
  channel: notificationChannelEnum('channel').notNull(),
  status: deliveryStatusEnum('status').notNull().default(DeliveryStatus.SENT),
  priority: notificationPriorityEnum('priority').notNull().default(NotificationPriority.NORMAL),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  error: text('error'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  sentAt: timestamp('sent_at'),
  scheduledFor: timestamp('scheduled_for'),
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  relatedEntityId: uuid('related_entity_id'),
  actionUrl: varchar('action_url', { length: 2048 }),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
