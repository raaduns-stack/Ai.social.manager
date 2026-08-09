import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('profile/notification-preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile/notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly notificationPreferencesService: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notification preferences' })
  getNotificationPreferences(@CurrentUser() user: { userId: string }) {
    return this.notificationPreferencesService.getNotificationPreferences(user.userId);
  }

  @Patch(':notificationType')
  @ApiOperation({ summary: 'Update a specific notification preference' })
  updateNotificationPreference(
    @CurrentUser() user: { userId: string },
    @Param('notificationType') notificationType: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationPreferencesService.updateNotificationPreference(
      user.userId,
      notificationType,
      dto,
    );
  }
}
