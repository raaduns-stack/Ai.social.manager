import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../database/schema';
import { PlanTierGuard } from '../auth/guards/plan-tiers.guard';
import { RequirePlanTiers } from '../auth/decorators/plan-tiers.decorator';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('whatsapp-link')
  @UseGuards(PlanTierGuard)
  @RequirePlanTiers('growth', 'enterprise')
  @ApiOperation({ summary: 'Get WhatsApp support link (Growth/Enterprise only)' })
  getWhatsappLink() {
    return this.supportService.getWhatsappLink();
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(@CurrentUser() user: { userId: string }, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets for the current user' })
  getTickets(@CurrentUser() user: { userId: string }) {
    return this.supportService.getTicketsForUser(user.userId);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get details and message history for a support ticket' })
  getTicketDetails(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.supportService.getTicketDetailsForUser(user.userId, id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a reply to a support ticket' })
  addMessage(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessageAsUser(user.userId, id, dto);
  }
}
