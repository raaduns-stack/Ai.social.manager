import {
  pgTable,
  uuid,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { users } from './users.schema';
import { contentSuggestions } from './content-suggestions.schema';

export const reactionEnum = pgEnum('feedback_reaction', [
  'up',
  'down',
]);

export const contentFeedback = pgTable('content_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),

  suggestionId: uuid('suggestion_id')
    .notNull()
    .references(() => contentSuggestions.id, {
      onDelete: 'cascade',
    }),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  reaction: reactionEnum('reaction').notNull(),

  rating: integer('rating').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contentFeedbackRelations = relations(
  contentFeedback,
  ({ one }) => ({
    suggestion: one(contentSuggestions, {
      fields: [contentFeedback.suggestionId],
      references: [contentSuggestions.id],
    }),

    user: one(users, {
      fields: [contentFeedback.userId],
      references: [users.id],
    }),
  }),
);

export type ContentFeedback = typeof contentFeedback.$inferSelect;
export type NewContentFeedback = typeof contentFeedback.$inferInsert;
