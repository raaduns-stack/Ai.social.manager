import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: "Get the logged-in user's current subscription and plan details" })
  findCurrent(@CurrentUser() user: { userId: string }) {
    return this.subscriptionsService.findByUserId(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Subscribe or upgrade to a new plan (creates a pending subscription)' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.userId, dto.planId);
  }

  @Patch('cancel')
  @ApiOperation({ summary: 'Cancel the current active subscription' })
  cancel(@CurrentUser() user: { userId: string }) {
    return this.subscriptionsService.cancel(user.userId);
  }
}
