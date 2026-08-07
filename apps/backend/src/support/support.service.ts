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
import { ConfigService } from '@nestjs/config';
import { ALL_ADMIN_ROLES, UserRole } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SupportService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Customer-Facing Operations
  // ---------------------------------------------------------------------------

  /**
   * Retrieves the premium WhatsApp support link.
   * Pulls the WhatsApp number from the application configuration.
   */
  getWhatsappLink(): { url: string } {
    const number = this.configService.get<string>('support.whatsappNumber');
    if (!number) {
      throw new BadRequestException('WhatsApp support is not configured.');
    }
    return { url: `https://wa.me/${number}` };
  }

  /**
   * Creates a new support ticket and its initial message.
   * Uses a transaction to ensure both records are inserted atomically.
   */
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

  /**
   * Adds a reply message to an existing support ticket on behalf of a user.
   * If the ticket was previously resolved, it will automatically be reopened.
   */
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
          .set({ status: 'open', updatedAt: new Date(), resolvedAt: null })
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

  async assignTicket(admin: { userId: string; role: string }, ticketId: string, assigneeId: string) {
    const currentTicket = await this.db.query.supportTickets.findFirst({
      where: eq(schema.supportTickets.id, ticketId),
    });

    if (!currentTicket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (admin.role !== UserRole.SUPER_ADMIN) {
      if (assigneeId !== admin.userId) {
        throw new ForbiddenException({
          message: 'You can only assign tickets to yourself',
          code: 'ASSIGNMENT_NOT_PERMITTED',
        });
      }

      if (currentTicket.assignedToStaffId && currentTicket.assignedToStaffId !== admin.userId) {
        throw new ForbiddenException({
          message: 'Ticket is already claimed by another staff member',
          code: 'ASSIGNMENT_NOT_PERMITTED',
        });
      }
    }

    // Verify staff user exists and is a valid staff member
    const staff = await this.db.query.users.findFirst({
      where: eq(schema.users.id, assigneeId),
    });

    if (!staff || !ALL_ADMIN_ROLES.includes(staff.role as UserRole)) {
      throw new BadRequestException('User is not a valid staff member');
    }

    // Update assignment and set status to in_progress if open
    const [ticket] = await this.db
      .update(schema.supportTickets)
      .set({
        assignedToStaffId: assigneeId,
        status: 'in_progress', // auto set to in_progress on assignment
        updatedAt: new Date(),
      })
      .where(eq(schema.supportTickets.id, ticketId))
      .returning();

    return ticket;
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (status === 'open' || status === 'in_progress') {
      updateData.resolvedAt = null;
    }

    const [ticket] = await this.db
      .update(schema.supportTickets)
      .set(updateData)
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
