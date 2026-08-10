import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentGatewaySettingsService } from './payment-gateway-settings.service';
import { UpdatePaymentGatewaySettingsDto } from './dto/update-payment-gateway-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('settings/payment-gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/settings/payment-gateway')
export class PaymentGatewaySettingsController {
  constructor(private readonly paymentGatewaySettingsService: PaymentGatewaySettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payment gateway settings' })
  getPaymentGatewaySettings() {
    return this.paymentGatewaySettingsService.getPaymentGatewaySettings();
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update payment gateway settings' })
  updatePaymentGatewaySettings(@Body() dto: UpdatePaymentGatewaySettingsDto) {
    return this.paymentGatewaySettingsService.updatePaymentGatewaySettings(dto);
  }
}
