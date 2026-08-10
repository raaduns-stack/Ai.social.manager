import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerProfileService } from './customer-profile.service';
import { UpdateCustomerCompanyProfileDto } from './dto/update-customer-company-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('profile/company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile/company')
export class CustomerProfileController {
  constructor(private readonly customerProfileService: CustomerProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user company profile' })
  getCompanyProfile(@CurrentUser() user: { userId: string }) {
    return this.customerProfileService.getCompanyProfile(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update or create the current user company profile' })
  updateCompanyProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCustomerCompanyProfileDto,
  ) {
    return this.customerProfileService.updateCompanyProfile(user.userId, dto);
  }
}
