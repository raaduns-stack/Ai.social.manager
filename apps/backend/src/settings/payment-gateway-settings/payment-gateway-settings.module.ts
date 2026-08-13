/**
 * PaymentGatewaySettingsModule
 * ----------------------------
 * NestJS feature module that manages the platform's payment gateway
 * integration credentials (e.g. Flutterwave public/secret keys, webhook
 * secret, live/test mode toggle) stored in `payment_gateway_settings`.
 *
 * Responsibilities:
 *  - Registers PaymentGatewaySettingsController for the
 *    /api/admin/settings/payment-gateway routes.
 *  - Provides PaymentGatewaySettingsService which handles AES encryption of
 *    the secret key and webhook secret so they are never stored in plain text.
 *  - Exports PaymentGatewaySettingsService so the payments module can fetch
 *    the live gateway credentials when processing a transaction.
 *
 * Security:
 *  - secretKey and webhookSecret are encrypted at rest via encryption.util.
 *  - Only masked values are returned to the admin UI (never plain text).
 *  - All endpoints are restricted to SUPER_ADMIN only.
 */
import { Module } from '@nestjs/common';
import { PaymentGatewaySettingsController } from './payment-gateway-settings.controller';
import { PaymentGatewaySettingsService } from './payment-gateway-settings.service';

@Module({
  controllers: [PaymentGatewaySettingsController],
  providers: [PaymentGatewaySettingsService],
  exports: [PaymentGatewaySettingsService],
})
export class PaymentGatewaySettingsModule {}
