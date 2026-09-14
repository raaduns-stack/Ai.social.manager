import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const designerProfiles = pgTable('designer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  bio: text('bio'),
  portfolioUrl: varchar('portfolio_url', { length: 500 }),
  specialties: text('specialties').array().default([]),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const designerProfilesRelations = relations(designerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [designerProfiles.userId],
    references: [users.id],
  }),
}));

export type DesignerProfile = typeof designerProfiles.$inferSelect;
export type NewDesignerProfile = typeof designerProfiles.$inferInsert;
