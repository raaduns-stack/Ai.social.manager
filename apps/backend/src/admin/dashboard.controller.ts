import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('dashboard-summary')
  @RequirePermission('dashboard', 'view')
  @ApiOperation({ summary: 'Get summary statistics for the admin dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getSummary(@Query('period') period?: string) {
    return this.dashboardService.getSummary(period);
  }

  @Get('dashboard-users')
  @RequirePermission('dashboard', 'view')
  @ApiOperation({
    summary: 'List customers currently on the Free plan or any paid Plan',
  })
  @ApiQuery({ name: 'group', required: true, enum: ['free', 'paid'] })
  getDashboardUsers(@Query('group') group?: string) {
    const safeGroup = group === 'paid' ? 'paid' : 'free';
    return this.dashboardService.getUsersByGroup(safeGroup);
  }

  @Get('analytics-summary')
  @RequirePermission('dashboard', 'view')
  @ApiOperation({ summary: 'Get real-data analytics summary for the admin analytics page' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getAnalyticsSummary(@Query('period') period?: string) {
    return this.dashboardService.getAnalyticsSummary(period);
  }
}