import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { AnalyticsService, AnalyticsPeriod } from './analytics.service';

const VALID_PERIODS: AnalyticsPeriod[] = ['day', 'week', 'month'];

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNT_MANAGER)
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  @ApiOperation({
    summary: 'Get analytics data for the Admin Analytics page',
    description:
      'Returns KPI cards, revenue time-series, social platform counts, and plan distribution. ' +
      'Sections without a backing DB table return { dataAvailable: false } rather than mock data.',
  })
  @ApiQuery({
    name:        'period',
    required:    false,
    enum:        ['day', 'week', 'month'],
    description: 'Aggregation window. Defaults to "month".',
  })
  getAnalytics(@Query('period') period?: string) {
    // Validate and default — avoids leaking arbitrary strings into SQL expressions
    const safePeriod: AnalyticsPeriod =
      VALID_PERIODS.includes(period as AnalyticsPeriod)
        ? (period as AnalyticsPeriod)
        : 'month';

    return this.analyticsService.getAnalytics(safePeriod);
  }
}
