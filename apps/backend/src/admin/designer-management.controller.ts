import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AdminDesignerManagementService } from './designer-management.service';

@ApiTags('admin-designer-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/designer-management')
export class AdminDesignerManagementController {
  constructor(private readonly designerManagementService: AdminDesignerManagementService) {}

  @Get('dashboard-summary')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get summary statistics for Designer Management dashboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getDashboardSummary(@Query('period') period?: string) {
    return this.designerManagementService.getDashboardSummary(period);
  }

  @Get('tasks')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'List tasks assigned to designers' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getTasks(@Query('period') period?: string) {
    return this.designerManagementService.getTasks(period);
  }

  @Get('submissions')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'List designer submissions' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getSubmissions(@Query('period') period?: string) {
    return this.designerManagementService.getSubmissions(period);
  }

  @Get('payments')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'List designer payments' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getPayments(@Query('period') period?: string) {
    return this.designerManagementService.getPayments(period);
  }

  @Get('activities')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'List recent designer activities' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  getActivities(@Query('period') period?: string) {
    return this.designerManagementService.getActivities(period);
  }

  @Get('designers')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'List designers with workload and performance metrics' })
  getDesigners() {
    return this.designerManagementService.getDesigners();
  }

  @Get('designers/:id')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get full details and history for a specific designer' })
  getDesignerProfile(@Param('id') id: string) {
    return this.designerManagementService.getDesignerProfile(id);
  }
}
