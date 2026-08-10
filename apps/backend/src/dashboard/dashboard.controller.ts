import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { PlanTierGuard } from '../auth/guards/plan-tiers.guard';
import { RequirePlanTiers } from '../auth/decorators/plan-tiers.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly socialAccountsService: SocialAccountsService,
  ) { }

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

  @Get('my-analytics-summary')
  @ApiOperation({
    summary:
      "Get real-data analytics summary for the logged-in user's Analytics page (connected accounts only — post/engagement metrics are not tracked yet)",
  })
  async getMyAnalyticsSummary(@CurrentUser() user: { userId: string }) {
    const accounts = await this.socialAccountsService.findAll(user.userId);
    const connectedAccounts = accounts.filter((account) => account.status === 'connected');

    return {
      connectedAccountsCount: connectedAccounts.length,
      connectedPlatforms: connectedAccounts.map((account) => ({
        platform: account.platform,
        accountHandle: account.accountHandle,
        connectedAt: account.connectedAt,
      })),
    };
  }

  @Get('premium-feature')
  @UseGuards(PlanTierGuard)
  @RequirePlanTiers('growth', 'enterprise')
  @ApiOperation({ summary: "A premium feature restricted to Growth or Enterprise plan tiers" })
  getPremiumFeature() {
    return {
      message: 'Welcome to the premium feature!',
      status: 'success',
    };
  }
}