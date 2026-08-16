import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentGatewaySettingsService } from './payment-gateway-settings.service';
import { UpdatePaymentGatewaySettingsDto } from './dto/update-payment-gateway-settings.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/payment-gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/payment-gateway')
export class PaymentGatewaySettingsController {
  constructor(private readonly paymentGatewaySettingsService: PaymentGatewaySettingsService) {}

  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get payment gateway settings' })
  getPaymentGatewaySettings() {
    return this.paymentGatewaySettingsService.getPaymentGatewaySettings();
  }

  @Patch()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update payment gateway settings' })
  updatePaymentGatewaySettings(@Body() dto: UpdatePaymentGatewaySettingsDto) {
    return this.paymentGatewaySettingsService.updatePaymentGatewaySettings(dto);
  }
}

