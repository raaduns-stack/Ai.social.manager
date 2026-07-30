import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Initialize Flutterwave payment for a subscription plan' })
  initialize(
    @CurrentUser() user: { userId: string },
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(user.userId, dto.planId);
  }

  @Post('verify/:transactionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Verify Flutterwave payment transaction and activate subscription' })
  verify(
    @CurrentUser() user: { userId: string },
    @Param('transactionId') transactionId: string,
  ) {
    return this.paymentsService.verifyPayment(user.userId, transactionId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Flutterwave payment completion webhooks' })
  webhook(
    @Headers('verif-hash') verifHash: string,
    @Body() body: any,
  ) {
    return this.paymentsService.handleWebhook(verifHash, body);
  }
}
