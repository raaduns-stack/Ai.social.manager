import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { supportTickets, ticketMessages } from './support-tickets.schema';
import { payments } from './payments.schema';
import { social_accounts } from './social-accounts.schema';
import { uploads } from './uploads.schema';
import { contentCalendar } from './content-calendar.schema';
import { notificationPreferences, customerCompanyProfile } from './settings.schema';

export const usersRelations = relations(users, ({ many, one }) => ({
  tickets: many(supportTickets, { relationName: 'userTickets' }),
  assignedTickets: many(supportTickets, { relationName: 'assignedTickets' }),
  payments: many(payments),
  socialAccounts: many(social_accounts),
  uploads: many(uploads),
  contentCalendarPosts: many(contentCalendar),
  notificationPreferences: many(notificationPreferences),
  customerCompanyProfile: one(customerCompanyProfile),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
    relationName: 'userTickets',
  }),
  assignedStaff: one(users, {
    fields: [supportTickets.assignedToStaffId],
    references: [users.id],
    relationName: 'assignedTickets',
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
  sender: one(users, {
    fields: [ticketMessages.senderId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const customerCompanyProfileRelations = relations(customerCompanyProfile, ({ one }) => ({
  user: one(users, {
    fields: [customerCompanyProfile.userId],
    references: [users.id],
  }),
}));

