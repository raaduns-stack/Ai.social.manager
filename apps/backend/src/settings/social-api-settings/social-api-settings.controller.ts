import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialApiSettingsService } from './social-api-settings.service';
import { UpdateSocialApiSettingDto } from './dto/update-social-api-setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/social-api')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/social-api')
export class SocialApiSettingsController {
  constructor(private readonly socialApiSettingsService: SocialApiSettingsService) {}

  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get all social API settings' })
  getSocialApiSettings() {
    return this.socialApiSettingsService.getSocialApiSettings();
  }

  @Patch(':platform')
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update a specific social API setting' })
  updateSocialApiSetting(
    @Param('platform') platform: string,
    @Body() dto: UpdateSocialApiSettingDto,
  ) {
    return this.socialApiSettingsService.updateSocialApiSetting(platform, dto);
  }
}

