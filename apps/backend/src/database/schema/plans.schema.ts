import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const planIntervalEnum = pgEnum('plan_interval', ['monthly', 'yearly']);

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  price: integer('price').notNull().default(0), // in cents
  interval: planIntervalEnum('interval').notNull().default('monthly'),
  features: json('features').$type<any>().default([]),
  maxSocialAccounts: integer('max_social_accounts').notNull().default(0),
  description: varchar('description', { length: 500 }),
  monthlyPostLimit: integer('monthly_post_limit').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
