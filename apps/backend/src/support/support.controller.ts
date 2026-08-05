import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../database/schema';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(@CurrentUser() user: { userId: string }, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all support tickets for the current user' })
  getTickets(@CurrentUser() user: { userId: string }) {
    return this.supportService.getTicketsForUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and message history for a support ticket' })
  getTicketDetails(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.supportService.getTicketDetailsForUser(user.userId, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a reply to a support ticket' })
  addMessage(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessageAsUser(user.userId, id, dto);
  }
}
