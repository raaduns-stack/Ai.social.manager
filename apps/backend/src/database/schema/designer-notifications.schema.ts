import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const designerNotificationTypeEnum = pgEnum('designer_notification_type', [
  'task',
  'revision',
  'approved',
  'payment',
  'system',
]);

export const designerNotifications = pgTable('designer_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  type: designerNotificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  read: boolean('read').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const digestFrequencyEnum = pgEnum('digest_frequency', ['instant', 'daily', 'weekly']);

export const designerNotificationPreferences = pgTable('designer_notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),

  designerId: uuid('designer_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  tasks: boolean('tasks').notNull().default(true),
  submissions: boolean('submissions').notNull().default(true),
  revisions: boolean('revisions').notNull().default(true),
  payments: boolean('payments').notNull().default(true),
  email: boolean('email').notNull().default(true),
  digest: digestFrequencyEnum('digest').notNull().default('instant'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const designerNotificationsRelations = relations(designerNotifications, ({ one }) => ({
  designer: one(users, {
    fields: [designerNotifications.designerId],
    references: [users.id],
  }),
}));

export const designerNotificationPreferencesRelations = relations(
  designerNotificationPreferences,
  ({ one }) => ({
    designer: one(users, {
      fields: [designerNotificationPreferences.designerId],
      references: [users.id],
    }),
  }),
);

export type DesignerNotification = typeof designerNotifications.$inferSelect;
export type NewDesignerNotification = typeof designerNotifications.$inferInsert;
export type DesignerNotificationPreference = typeof designerNotificationPreferences.$inferSelect;
export type NewDesignerNotificationPreference = typeof designerNotificationPreferences.$inferInsert;
