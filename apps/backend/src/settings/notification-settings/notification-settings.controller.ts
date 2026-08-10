import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationSettingsService } from './notification-settings.service';
import { UpdateNotificationTypeSettingsDto } from './dto/update-notification-type-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('settings/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings/notifications')
export class NotificationSettingsController {
  constructor(private readonly notificationSettingsService: NotificationSettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Get all notification type settings' })
  getAllNotificationSettings() {
    return this.notificationSettingsService.getAllNotificationSettings();
  }

  @Patch(':notificationType')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a specific notification type setting' })
  updateNotificationSetting(
    @Param('notificationType') notificationType: string,
    @Body() dto: UpdateNotificationTypeSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSetting(notificationType, dto);
  }
}
