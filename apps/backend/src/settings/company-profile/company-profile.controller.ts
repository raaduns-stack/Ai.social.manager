import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('settings/company-profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings/company-profile')
export class CompanyProfileController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiOperation({ summary: 'Get the company profile' })
  getCompanyProfile() {
    return this.companyProfileService.getCompanyProfile();
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update the company profile' })
  updateCompanyProfile(@Body() dto: UpdateCompanyProfileDto) {
    return this.companyProfileService.updateCompanyProfile(dto);
  }
}
