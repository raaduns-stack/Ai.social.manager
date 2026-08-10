import { Module } from '@nestjs/common';
import { PaymentGatewaySettingsController } from './payment-gateway-settings.controller';
import { PaymentGatewaySettingsService } from './payment-gateway-settings.service';

@Module({
  controllers: [PaymentGatewaySettingsController],
  providers: [PaymentGatewaySettingsService],
  exports: [PaymentGatewaySettingsService],
})
export class PaymentGatewaySettingsModule {}
