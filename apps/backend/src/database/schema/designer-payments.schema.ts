import { pgTable, uuid, varchar, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'processing',
  'paid',
  'failed',
]);

export const designerPayments = pgTable('designer_payments', {
  id: uuid('id').primaryKey().defaultRandom(),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  amount: integer('amount').notNull(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  period: varchar('period', { length: 100 }),

  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 50 }),
  accountName: varchar('account_name', { length: 255 }),

  paidAt: timestamp('paid_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const designerPaymentMethods = pgTable('designer_payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),

  isDefault: boolean('is_default').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const designerPaymentsRelations = relations(designerPayments, ({ one }) => ({
  designer: one(users, {
    fields: [designerPayments.designerId],
    references: [users.id],
  }),
}));

export const designerPaymentMethodsRelations = relations(designerPaymentMethods, ({ one }) => ({
  designer: one(users, {
    fields: [designerPaymentMethods.designerId],
    references: [users.id],
  }),
}));

export type DesignerPayment = typeof designerPayments.$inferSelect;
export type NewDesignerPayment = typeof designerPayments.$inferInsert;
export type DesignerPaymentMethod = typeof designerPaymentMethods.$inferSelect;
export type NewDesignerPaymentMethod = typeof designerPaymentMethods.$inferInsert;
