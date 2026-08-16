import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { QueryActivityLogsDto } from '../../activity-logs/dto/query-activity-logs.dto';

@ApiTags('admin-activity-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/activity-logs')
export class AdminActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @RequirePermission('audit_logs', 'view')
  @ApiOperation({ summary: 'Get paginated activity logs (admin)' })
  findAll(@Query() query: QueryActivityLogsDto) {
    return this.activityLogsService.findAll(query);
  }
}

