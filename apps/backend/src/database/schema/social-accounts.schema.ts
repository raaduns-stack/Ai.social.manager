import { pgTable, uuid, varchar, timestamp, pgEnum, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

// Enum for social platform
export const socialPlatformEnum = pgEnum('social_platform', [
  'facebook',
  'instagram',
  'tiktok',
  'x',
  'youtube',
  'linkedin',
  'tumblr',
]);

// Enum for connection status
export const socialStatusEnum = pgEnum('social_status', [
  'connected',
  'disconnected',
  'action_required',
]);

export const social_accounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  platform: socialPlatformEnum('platform').notNull(),
  accountHandle: varchar('account_handle', { length: 255 }).notNull(),
  status: socialStatusEnum('status').notNull(),
  connectedAt: timestamp('connected_at'),
  tokenExpiresAt: timestamp('token_expires_at'),
  providerUserId: varchar('provider_user_id', { length: 255 }),
  accessToken: text('access_token'),
  tokenSecret: text('token_secret'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const socialAccountsRelations = relations(social_accounts, ({ one }) => ({
  user: one(users, {
    fields: [social_accounts.userId],
    references: [users.id],
  }),
}));

export type SocialAccount = typeof social_accounts.$inferSelect;
export type NewSocialAccount = typeof social_accounts.$inferInsert;
