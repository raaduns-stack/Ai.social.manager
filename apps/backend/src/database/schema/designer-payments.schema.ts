import { pgTable, uuid, varchar, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'approved',
  'processing',
  'paid',
  'successful',
  'failed',
  'declined',
]);

export const designerPayments = pgTable('designer_payments', {
  id: uuid('id').primaryKey().defaultRandom(),

  designerId: uuid('designer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  amount: integer('amount').notNull(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  period: varchar('period', { length: 100 }),

  reference: varchar('reference', { length: 100 }),
  payoutType: varchar('payout_type', { length: 50 }).notNull().default('manual'),
  fee: integer('fee').notNull().default(0),
  netAmount: integer('net_amount'),
  relatedWork: varchar('related_work', { length: 500 }),
  notes: varchar('notes', { length: 1000 }),

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

export const designerPaymentSettings = pgTable('designer_payment_settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  perImageAmount: integer('per_image_amount').notNull().default(500000), // ₦5,000 in kobo
  perImageToCodeAmount: integer('per_image_to_code_amount').notNull().default(1000000), // ₦10,000 in kobo

  payoutSchedule: varchar('payout_schedule', { length: 20 }).notNull().default('weekly'), // 'weekly' | 'monthly'
  payoutDayOfWeek: integer('payout_day_of_week').notNull().default(2), // 1=Mon, 2=Tue, etc.
  payoutDayOfMonth: integer('payout_day_of_month').notNull().default(28), // 1-28
  manualPayoutFeePercent: integer('manual_payout_fee_percent').notNull().default(2), // 2%

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
export type DesignerPaymentSettings = typeof designerPaymentSettings.$inferSelect;
export type NewDesignerPaymentSettings = typeof designerPaymentSettings.$inferInsert;
