import { Controller, Post, Get, Body, Query, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { CreateSystemAnnouncementDto } from './dto/create-announcement.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { CreateContentApprovalDto } from './dto/create-content-approval.dto';
import { CreateContentPublishedDto } from './dto/create-content-published.dto';
import { CreateSubscriptionReminderDto } from './dto/create-subscription-reminder.dto';
import { CreateScheduledNotificationDto } from './dto/create-scheduled-notification.dto';
import { NotificationHistoryQueryDto } from './dto/notification-history-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationType, NOTIFICATION_TYPE_VALUES, DeliveryStatus, DELIVERY_STATUS_VALUES, NotificationChannel, NOTIFICATION_CHANNEL_VALUES, NotificationPriority, NOTIFICATION_PRIORITY_VALUES } from '../common/enums';

@ApiTags('admin/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly scheduledNotificationsService: ScheduledNotificationsService,
  ) {}

  @Post('system-announcement')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Send system announcement to users' })
  async sendSystemAnnouncement(@Body() dto: CreateSystemAnnouncementDto, @CurrentUser() user: { userId: string }) {
    if (dto.targetUserIds && dto.targetUserIds.length > 0) {
      const customers = await this.notificationsService.validateCustomerUserIds(dto.targetUserIds);
      if (customers.invalid.length > 0) {
        throw new BadRequestException({
          message: 'Invalid recipient IDs',
          invalidUserIds: customers.invalid,
        });
      }
    }

    return this.notificationsService.dispatchSystemAnnouncement({
      title: dto.title,
      message: dto.message,
      targetUserIds: dto.targetUserIds,
      channel: dto.channel as any,
      actionUrl: dto.actionUrl,
      metadata: dto.metadata,
    }, user.userId);
  }

  @Post('maintenance')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Send system maintenance notification to users' })
  async sendMaintenanceNotification(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: { userId: string }) {
    if (dto.targetAudience === 'selected' && dto.targetUserIds && dto.targetUserIds.length > 0) {
      const customers = await this.notificationsService.validateCustomerUserIds(dto.targetUserIds);
      if (customers.invalid.length > 0) {
        throw new BadRequestException({
          message: 'Invalid recipient IDs',
          invalidUserIds: customers.invalid,
        });
      }
    }

    return this.notificationsService.dispatchMaintenance({
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      description: dto.message,
      priority: dto.priority,
      targetAudience: dto.targetAudience || 'all',
      targetUserIds: dto.targetUserIds,
    }, user.userId);
  }

  @Post('content-approval')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Notify customer when content is ready for review' })
  async sendContentApproval(@Body() dto: CreateContentApprovalDto, @CurrentUser() user: { userId: string }) {
    const customers = await this.notificationsService.validateCustomerUserIds([dto.userId]);
    if (customers.invalid.length > 0) {
      throw new BadRequestException({
        message: 'Invalid recipient ID',
        invalidUserIds: customers.invalid,
      });
    }

    return this.notificationsService.dispatchContentApproval({
      customer: { id: dto.userId, email: '', name: '' },
      contentId: dto.calendarPostId,
      contentTitle: dto.title,
      reviewUrl: dto.contentLink || '/dashboard/content-calendar',
    }, user.userId);
  }

  @Post('content-published')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Notify customer when content is published or fails' })
  async sendContentPublished(@Body() dto: CreateContentPublishedDto, @CurrentUser() user: { userId: string }) {
    const customers = await this.notificationsService.validateCustomerUserIds([dto.userId]);
    if (customers.invalid.length > 0) {
      throw new BadRequestException({
        message: 'Invalid recipient ID',
        invalidUserIds: customers.invalid,
      });
    }

    return this.notificationsService.dispatchPublishing({
      customer: { id: dto.userId, email: '', name: '' },
      postId: dto.scheduledPostId,
      postTitle: dto.title,
      platform: dto.platform || 'Unknown',
      isSuccess: dto.status === 'PUBLISHED',
      publishErrorMessage: dto.failureReason,
    }, user.userId);
  }

  @Post('subscription-reminder')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Send subscription reminder to a customer' })
  async sendSubscriptionReminder(@Body() dto: CreateSubscriptionReminderDto, @CurrentUser() user: { userId: string }) {
    const customers = await this.notificationsService.validateCustomerUserIds([dto.userId]);
    if (customers.invalid.length > 0) {
      throw new BadRequestException({
        message: 'Invalid recipient ID',
        invalidUserIds: customers.invalid,
      });
    }

    return this.notificationsService.dispatchSubscriptionReminder({
      user: { id: dto.userId, email: '', name: '' },
      daysToExpiry: 0,
      expiryDate: new Date(),
    }, user.userId);
  }

  @Post('scheduled')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Schedule a notification for future delivery' })
  scheduleNotification(@Body() dto: CreateScheduledNotificationDto, @CurrentUser() user: { userId: string }) {
    return this.scheduledNotificationsService.create({
      userId: dto.userId,
      createdById: user.userId,
      type: dto.type,
      channel: dto.channel,
      title: dto.title,
      message: dto.message,
      scheduledFor: new Date(dto.scheduledFor),
      repeatInterval: dto.repeatInterval,
      repeatUntil: dto.repeatUntil ? new Date(dto.repeatUntil) : undefined,
    });
  }

  @Get('scheduled')
  @RequirePermission('notification_management', 'view')
  @ApiOperation({ summary: 'List scheduled notifications' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listScheduled(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.scheduledNotificationsService.findAll({
      userId,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: page ? (Number(page) - 1) * (Number(limit) || 50) : undefined,
    });
  }

  @Patch('scheduled/:id/cancel')
  @RequirePermission('notification_management', 'edit')
  @ApiOperation({ summary: 'Cancel a scheduled notification' })
  cancelScheduled(@Param('id') id: string) {
    return this.scheduledNotificationsService.cancel(id);
  }

  @Get('history')
  @RequirePermission('notification_management', 'view')
  @ApiOperation({ summary: 'Retrieve audit logs / history of sent notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'channel', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'senderId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'isRead', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'readAt', 'sentAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  getHistory(@Query() query: NotificationHistoryQueryDto) {
    return this.notificationsService.getAdminHistory({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      type: query.type,
      status: query.status,
      channel: query.channel,
      priority: query.priority,
      senderId: query.senderId,
      startDate: query.startDate,
      endDate: query.endDate,
      isRead: query.isRead !== undefined ? query.isRead === 'true' : undefined,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
