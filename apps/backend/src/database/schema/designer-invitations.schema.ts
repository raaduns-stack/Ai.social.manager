import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

/**
 * designer_invitations — org-issued invitations for designer accounts.
 *
 * Flow: staff creates an invite (email) → raw token is emailed as an
 * activation link (/designer/activate?token=...) → designer sets a password →
 * the invite is consumed and a role=designer user is created/activated.
 *
 * Only the SHA-256 hash of the token is stored; the raw token is never
 * persisted, so a database read alone cannot activate accounts.
 */
export const designerInvitations = pgTable('designer_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),

  email: varchar('email', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull(),

  invitedBy: uuid('invited_by').references(() => users.id, {
    onDelete: 'set null',
  }),

  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const designerInvitationsRelations = relations(designerInvitations, ({ one }) => ({
  inviter: one(users, {
    fields: [designerInvitations.invitedBy],
    references: [users.id],
  }),
}));

export type DesignerInvitation = typeof designerInvitations.$inferSelect;
export type NewDesignerInvitation = typeof designerInvitations.$inferInsert;
