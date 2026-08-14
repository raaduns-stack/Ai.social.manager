import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { LoginHistoryService } from '../../login-history/login-history.service';
import { QueryLoginHistoryDto } from '../../login-history/dto/query-login-history.dto';

@ApiTags('admin-login-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/login-history')
export class AdminLoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) {}

  @Get()
  @RequirePermission('audit_logs', 'view')
  @ApiOperation({ summary: 'Get paginated login history (admin)' })
  findAll(@Query() query: QueryLoginHistoryDto) {
    return this.loginHistoryService.findAll(query);
  }

  @Get('user/:userId')
  @RequirePermission('audit_logs', 'view')
  @ApiOperation({ summary: 'Get all login attempts for a specific user (admin)' })
  findByUser(@Param('userId') userId: string) {
    return this.loginHistoryService.findByUser(userId);
  }
}

