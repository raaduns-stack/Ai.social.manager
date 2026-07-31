import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('my-summary')
  @ApiOperation({ summary: "Get the logged-in user's customer dashboard summary" })
  async getMySummary(@CurrentUser() user: { userId: string }) {
    try {
      const sub = await this.subscriptionsService.findByUserId(user.userId);
      return {
        activeSubscription: {
          planName: sub.plan?.name || 'Free Plan',
          status: sub.status,
        },
      };
    } catch (err) {
      // If no subscription is found, fall back gracefully to a default Free Plan status
      return {
        activeSubscription: {
          planName: 'Free Plan',
          status: 'active',
        },
      };
    }
  }
}
