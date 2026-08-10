import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupportService } from '../../support/support.service';
import { AssignTicketDto } from '../../support/dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from '../../support/dto/update-ticket-status.dto';
import { CreateMessageDto } from '../../support/dto/create-message.dto';
import { User } from '../../database/schema';

@ApiTags('admin-support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'account_manager')
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets (optional status filter)' })
  getTickets(
    @Query('status') status?: 'open' | 'in_progress' | 'resolved' | 'closed',
  ) {
    return this.supportService.getAllTickets(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and messages for any support ticket' })
  getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetailsForAdmin(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a support ticket to a staff member' })
  assignTicket(
    @CurrentUser() admin: { userId: string; role: string },
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(admin, id, dto.assigneeId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a support ticket status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.supportService.updateTicketStatus(id, dto.status);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a reply/message to a support ticket as admin' })
  addMessage(
    @CurrentUser() admin: { userId: string },
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessageAsAdmin(admin.userId, id, dto);
  }
}
