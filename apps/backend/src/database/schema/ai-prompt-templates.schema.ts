// ======================================================
// AI Prompt Templates Table
// This table stores all prompt templates used by the AI.
// Admins can create, edit, activate/deactivate and manage
// these prompts from the Admin Panel.
// ======================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

// Create a new database table called "ai_prompt_templates"
export const aiPromptTemplates = pgTable('ai_prompt_templates', {

  // Unique ID for each prompt
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),

  // Prompt name shown in the admin panel
  // Example: Instagram Caption Generator
  name: varchar('name', { length: 255 }).notNull(),

  // Category of the prompt
  // Example:
  // Caption
  // Idea
  // Hashtag
  // Rewrite
  category: varchar('category', { length: 100 }).notNull(),

  // The actual AI prompt that will be sent to the AI
  prompt: text('prompt').notNull(),

  // Determines whether this prompt is currently active
  // true = AI can use it
  // false = hidden/disabled
  isActive: boolean('is_active')
    .default(true)
    .notNull(),

  // Date created
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  // Last updated date
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
});

// TypeScript type for reading prompt records
export type AIPromptTemplate =
  typeof aiPromptTemplates.$inferSelect;

// TypeScript type for inserting new prompt records
export type NewAIPromptTemplate =
  typeof aiPromptTemplates.$inferInsert;