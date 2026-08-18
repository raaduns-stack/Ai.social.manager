import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  json,
  pgEnum,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { contentFeedback } from './content-feedback.schema';
/**
 * PostgreSQL Enum defining allowable types of generated content suggestions.
 */
export const suggestionTypeEnum = pgEnum('suggestion_type', [
  'caption',
  'idea',
]);

/**
 * PostgreSQL Enum defining variation approval status states.
 */
export const variationApprovalStatusEnum = pgEnum('variation_approval_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REVISION_REQUESTED',
  'REJECTED',
]);

import { contentCalendar } from './content-calendar.schema';

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

  /** Optional foreign key linking the suggestion to a specific calendar post. */
  postId: uuid('post_id')
    .references(() => contentCalendar.id, { onDelete: 'cascade' }),

  /** Title / headline of the suggestion. */
  title: varchar('title', { length: 255 }),

  /** Categorizes the suggestion (e.g., 'caption' or 'idea'). */
  type: suggestionTypeEnum('type').notNull(),
  /** The actual text content generated (up to 1000 characters). */
  content: varchar('content', { length: 1000 }).notNull(),
  /** Optional list of generated hashtags stored as a JSON array of strings. */
  hashtags: json('hashtags').$type<string[]>().default([]),
  /** Approval status of this variation. */
  approvalStatus: variationApprovalStatusEnum('approval_status')
    .notNull()
    .default('PENDING_APPROVAL'),
  /** Optional revision feedback notes left by the user. */
  revisionNotes: text('revision_notes'),
  /** Timestamp recording when the suggestion was created. */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
/**
 * Defines Drizzle ORM relational mappings for `contentSuggestions`.
 */
export const contentSuggestionsRelations = relations(
  contentSuggestions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [contentSuggestions.userId],
      references: [users.id],
    }),

    feedback: many(contentFeedback),

    post: one(contentCalendar, {
      fields: [contentSuggestions.postId],
      references: [contentCalendar.id],
    }),
  }),
);
/** TypeScript type inferred for reading/selecting records from the `content_suggestions` table. */
export type ContentSuggestion = typeof contentSuggestions.$inferSelect;
/** TypeScript type inferred for inserting new records into the `content_suggestions` table. */
export type NewContentSuggestion = typeof contentSuggestions.$inferInsert;