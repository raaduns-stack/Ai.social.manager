import { pgTable, uuid, varchar, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Matches the roles referenced across the customer/admin feature docs:
// Client accounts, plus internal staff roles.
export const userRoleEnum = pgEnum('user_role', [
  'client',
  'designer',
  'reviewer',
  'account_manager',
  'super_admin',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  role: userRoleEnum('role').notNull().default('client'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
