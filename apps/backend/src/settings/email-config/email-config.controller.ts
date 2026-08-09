import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailConfigService } from './email-config.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('settings/email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings/email')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get email configuration' })
  getEmailConfig() {
    return this.emailConfigService.getEmailConfig();
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update email configuration' })
  updateEmailConfig(@Body() dto: UpdateEmailConfigDto) {
    return this.emailConfigService.updateEmailConfig(dto);
  }

  @Post('test')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a test email using current configuration' })
  sendTestEmail(@Body() dto: TestEmailDto) {
    return this.emailConfigService.sendTestEmail(dto);
  }
}
