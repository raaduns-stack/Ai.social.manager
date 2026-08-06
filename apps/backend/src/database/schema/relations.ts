import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { payments } from './payments.schema';
import { social_accounts } from './social-accounts.schema';
import { uploads } from './uploads.schema';

export const usersRelations = relations(users, ({ many }) => ({
  payments: many(payments),
  socialAccounts: many(social_accounts),
  uploads: many(uploads),
}));
