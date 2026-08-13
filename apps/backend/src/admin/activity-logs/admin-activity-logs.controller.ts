import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { QueryActivityLogsDto } from '../../activity-logs/dto/query-activity-logs.dto';

@ApiTags('admin-activity-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'account_manager')
@Controller('admin/activity-logs')
export class AdminActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated activity logs (admin)' })
  findAll(@Query() query: QueryActivityLogsDto) {
    return this.activityLogsService.findAll(query);
  }
}
