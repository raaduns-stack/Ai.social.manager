import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationTypeSettingsDto } from './dto/update-notification-type-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/notifications')
export class NotificationSettingsController {
  constructor(private readonly notificationSettingsService: NotificationSettingsService) {}

  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get all notification type settings' })
  getAllNotificationSettings() {
    return this.notificationSettingsService.getAllNotificationSettings();
  }

  @Patch(':notificationType')
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update a specific notification type setting' })
  updateNotificationSetting(
    @Param('notificationType') notificationType: string,
    @Body() dto: UpdateNotificationTypeSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSetting(notificationType, dto);
  }
}

