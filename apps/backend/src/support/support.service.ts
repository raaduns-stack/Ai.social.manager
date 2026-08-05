import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SupportService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  // ---------------------------------------------------------------------------
  // Customer-Facing Operations
  // ---------------------------------------------------------------------------

  async createTicket(userId: string, dto: CreateTicketDto) {
    return await this.db.transaction(async (tx) => {
      const [ticket] = await tx
        .insert(schema.supportTickets)
        .values({
          userId,
          subject: dto.subject,
          category: dto.category,
          priority: dto.priority || 'medium',
          status: 'open',
        })
        .returning();

      await tx.insert(schema.ticketMessages).values({
        ticketId: ticket.id,
        senderId: userId,
        message: dto.message,
      });

      return ticket;
    });
  }

  async getTicketsForUser(userId: string) {
    return await this.db.query.supportTickets.findMany({
      where: eq(schema.supportTickets.userId, userId),
      orderBy: [desc(schema.supportTickets.createdAt)],
    });
  }

  async getTicketDetailsForUser(userId: string, ticketId: string) {
    const ticket = await this.db.query.supportTickets.findFirst({
      where: and(
        eq(schema.supportTickets.id, ticketId),
        eq(schema.supportTickets.userId, userId),
      ),
      with: {
        messages: {
          orderBy: [schema.ticketMessages.createdAt],
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async addMessageAsUser(userId: string, ticketId: string, dto: CreateMessageDto) {
    // Verify ownership and that ticket is not closed/resolved (or let them reply anyway, standard support allows replying)
    const ticket = await this.db.query.supportTickets.findFirst({
      where: and(
        eq(schema.supportTickets.id, ticketId),
        eq(schema.supportTickets.userId, userId),
      ),
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (ticket.status === 'closed') {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    return await this.db.transaction(async (tx) => {
      // Reopen ticket if it was resolved
      if (ticket.status === 'resolved') {
        await tx
          .update(schema.supportTickets)
          .set({ status: 'open', updatedAt: new Date() })
          .where(eq(schema.supportTickets.id, ticketId));
      } else {
        await tx
          .update(schema.supportTickets)
          .set({ updatedAt: new Date() })
          .where(eq(schema.supportTickets.id, ticketId));
      }

      const [msg] = await tx
        .insert(schema.ticketMessages)
        .values({
          ticketId,
          senderId: userId,
          message: dto.message,
        })
        .returning();

      return msg;
    });
  }

  // ---------------------------------------------------------------------------
  // Admin-Facing Operations
  // ---------------------------------------------------------------------------

  async getAllTickets(statusFilter?: 'open' | 'in_progress' | 'resolved' | 'closed') {
    const whereClause = statusFilter
      ? eq(schema.supportTickets.status, statusFilter)
      : undefined;

    return await this.db.query.supportTickets.findMany({
      where: whereClause,
      orderBy: [desc(schema.supportTickets.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignedStaff: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  async getTicketDetailsForAdmin(ticketId: string) {
    const ticket = await this.db.query.supportTickets.findFirst({
      where: eq(schema.supportTickets.id, ticketId),
      with: {
        messages: {
          orderBy: [schema.ticketMessages.createdAt],
        },
        user: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignedStaff: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async assignTicket(ticketId: string, staffId: string) {
    // Verify staff user exists
    const staff = await this.db.query.users.findFirst({
      where: eq(schema.users.id, staffId),
    });

    if (!staff) {
      throw new NotFoundException('Staff user not found');
    }

    // Update assignment and set status to in_progress if open
    const [ticket] = await this.db
      .update(schema.supportTickets)
      .set({
        assignedToStaffId: staffId,
        status: 'in_progress', // auto set to in_progress on assignment
        updatedAt: new Date(),
      })
      .where(eq(schema.supportTickets.id, ticketId))
      .returning();

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    const [ticket] = await this.db
      .update(schema.supportTickets)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.supportTickets.id, ticketId))
      .returning();

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  async addMessageAsAdmin(adminId: string, ticketId: string, dto: CreateMessageDto) {
    const ticket = await this.db.query.supportTickets.findFirst({
      where: eq(schema.supportTickets.id, ticketId),
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return await this.db.transaction(async (tx) => {
      // Update updatedAt timestamp and ensure status isn't closed if replying
      const newStatus = ticket.status === 'open' ? 'in_progress' : ticket.status;
      
      await tx
        .update(schema.supportTickets)
        .set({ 
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.supportTickets.id, ticketId));

      const [msg] = await tx
        .insert(schema.ticketMessages)
        .values({
          ticketId,
          senderId: adminId,
          message: dto.message,
        })
        .returning();

      return msg;
    });
  }
}
