import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get current customer's in-app notifications" })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  getFeed(
    @CurrentUser() user: { userId: string },
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const isUnreadOnly = unreadOnly === 'true' || unreadOnly === '1';
    return this.notificationsService.getCustomerFeed(user.userId, isUnreadOnly);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all customer notifications as read' })
  markAllAsRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, id);
  }
}
