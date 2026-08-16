import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/system')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get system settings' })
  getSystemSettings() {
    return this.systemSettingsService.getSystemSettings();
  }

  @Patch()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update system settings' })
  updateSystemSettings(@Body() dto: UpdateSystemSettingsDto) {
    return this.systemSettingsService.updateSystemSettings(dto);
  }
}

