import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { supportTickets, ticketMessages } from './support-tickets.schema';

export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(supportTickets, { relationName: 'userTickets' }),
  assignedTickets: many(supportTickets, { relationName: 'assignedTickets' }),
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
