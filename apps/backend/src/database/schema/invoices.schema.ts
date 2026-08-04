import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { payments } from './payments.schema';
import { subscriptions } from './subscriptions.schema';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'paid',
  'unpaid',
  'void',
  'refunded',
]);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  paymentId: uuid('payment_id')
    .references(() => payments.id, { onDelete: 'set null' }),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  amount: integer('amount').notNull(), // in kobo/cents
  currency: varchar('currency', { length: 10 }).notNull().default('NGN'),
  status: invoiceStatusEnum('status').notNull().default('paid'),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  issuedAt: timestamp('issued_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [invoices.paymentId],
    references: [payments.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
