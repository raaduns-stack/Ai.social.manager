import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
/**
 * PostgreSQL Enum defining allowable types of generated content suggestions.
 */
export const suggestionTypeEnum = pgEnum('suggestion_type', [
  'caption',
  'idea',
]);
/**
 * Database table schema for storing generated content suggestions (captions, ideas)
 * linked to specific users.
 */
export const contentSuggestions = pgTable('content_suggestions', {
  /** Primary key generated automatically as a random v4 UUID. */
  id: uuid('id').primaryKey().defaultRandom(),

/** 
   * Foreign key linking the suggestion to a user.
   * Cascade deletes all suggestions if the referenced user is deleted.
   */
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** Categorizes the suggestion (e.g., 'caption' or 'idea'). */
  type: suggestionTypeEnum('type').notNull(),
/** The actual text content generated (up to 1000 characters). */
  content: varchar('content', { length: 1000 }).notNull(),
/** Optional list of generated hashtags stored as a JSON array of strings. */
  hashtags: json('hashtags').$type<string[]>().default([]),
/** Timestamp recording when the suggestion was created. */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
/**
 * Defines Drizzle ORM relational mappings for `contentSuggestions`.
 */
export const contentSuggestionsRelations = relations(
  contentSuggestions,
  ({ one }) => ({
    /** Many-to-One relationship connecting each content suggestion back to its owner. */
    user: one(users, {
      fields: [contentSuggestions.userId],
      references: [users.id],
    }),
  }),
);
/** TypeScript type inferred for reading/selecting records from the `content_suggestions` table. */
export type ContentSuggestion = typeof contentSuggestions.$inferSelect;
/** TypeScript type inferred for inserting new records into the `content_suggestions` table. */
export type NewContentSuggestion = typeof contentSuggestions.$inferInsert;