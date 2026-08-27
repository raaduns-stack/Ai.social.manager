import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('admin/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('system-announcement')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Send system announcement to users' })
  sendSystemAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.notificationsService.dispatchSystemAnnouncement({
      title: dto.title,
      message: dto.message,
      targetUserIds: dto.targetUserIds,
      channel: dto.channel,
    });
  }

  @Post('maintenance')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Send system maintenance notification to all users' })
  sendMaintenanceNotification(@Body() dto: CreateMaintenanceDto) {
    return this.notificationsService.dispatchMaintenance({
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      description: dto.description,
    });
  }

  @Get('history')
  @RequirePermission('notification_management', 'view')
  @ApiOperation({ summary: 'Retrieve audit logs / history of sent notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  getHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('type') type?: 'ANNOUNCEMENT' | 'SUBSCRIPTION' | 'APPROVAL' | 'PUBLISHING' | 'MAINTENANCE',
    @Query('status') status?: 'SENT' | 'FAILED' | 'PENDING',
  ) {
    return this.notificationsService.getAdminHistory({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      userId,
      type,
      status,
    });
  }
}
