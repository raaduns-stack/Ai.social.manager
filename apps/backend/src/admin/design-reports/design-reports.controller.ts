import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { DesignReportsService } from './design-reports.service';
import { DesignReportsQueryDto } from './dto/design-reports-query.dto';

@ApiTags('admin-design-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/design-reports')
export class DesignReportsController {
  constructor(private readonly reportsService: DesignReportsService) {}

  @Get('overview')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get high-level executive design overview & KPIs' })
  async getOverview(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getOverview(query);
  }

  @Get('design-performance')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get design performance breakdown, statuses, categories & trends' })
  async getDesignPerformance(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getDesignPerformance(query);
  }

  @Get('designer-performance')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get individual graphic designer metrics, workloads and earnings' })
  async getDesignerPerformance(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getDesignerPerformance(query);
  }

  @Get('staff-performance')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get staff performance on design tasks, reviews, approvals & revisions' })
  async getStaffPerformance(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getStaffPerformance(query);
  }

  @Get('payment-earnings')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get designer payment & earnings financial breakdown and payout status distribution' })
  async getPaymentEarnings(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getPaymentEarnings(query);
  }

  @Get('operational-workflow')
  @RequirePermission('analytics', 'view')
  @ApiOperation({ summary: 'Get overall design operational workflow stages and throughput metrics' })
  async getOperationalWorkflow(@Query() query: DesignReportsQueryDto) {
    return this.reportsService.getOperationalWorkflow(query);
  }
}
