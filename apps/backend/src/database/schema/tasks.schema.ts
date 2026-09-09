import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const taskPriorityEnum = pgEnum('task_priority', ['high', 'medium', 'low']);

export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'done']);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),

  title: varchar('title', { length: 255 }).notNull(),
  brief: text('brief'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  dueDate: timestamp('due_date'),
  status: taskStatusEnum('status').notNull().default('open'),

  assignedTo: uuid('assigned_to')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  assignedBy: uuid('assigned_by').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
  }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
