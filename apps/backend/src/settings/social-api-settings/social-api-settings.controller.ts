import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialApiSettingsService } from './social-api-settings.service';
import { UpdateSocialApiSettingDto } from './dto/update-social-api-setting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('settings/social-api')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings/social-api')
export class SocialApiSettingsController {
  constructor(private readonly socialApiSettingsService: SocialApiSettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all social API settings' })
  getSocialApiSettings() {
    return this.socialApiSettingsService.getSocialApiSettings();
  }

  @Patch(':platform')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a specific social API setting' })
  updateSocialApiSetting(
    @Param('platform') platform: string,
    @Body() dto: UpdateSocialApiSettingDto,
  ) {
    return this.socialApiSettingsService.updateSocialApiSetting(platform, dto);
  }
}
