import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { subscriptions } from './subscriptions.schema';
import { plans } from './plans.schema';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'successful',
  'failed',
  'refunded',
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id, { onDelete: 'set null' }),
  planId: uuid('plan_id')
    .references(() => plans.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(), // in kobo/cents
  currency: varchar('currency', { length: 10 }).notNull().default('NGN'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  gateway: varchar('gateway', { length: 50 }).notNull().default('flutterwave'),
  gatewayReference: varchar('gateway_reference', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  plan: one(plans, {
    fields: [payments.planId],
    references: [plans.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
