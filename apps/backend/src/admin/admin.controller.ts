import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get list of all users' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get details for a single user' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Suspend or activate a user account' })
  suspendUser(@Param('id') id: string, @Body('suspend') suspend: boolean) {
    return this.adminService.suspendUser(id, suspend);
  }

  @Delete('users/:id')
  @RequirePermission('user_management', 'delete')
  @ApiOperation({ summary: 'Permanently delete a user account' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('billing/stats')
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'Get billing stats overview' })
  getBillingStats() {
    return this.adminService.getBillingStats();
  }

  @Get('billing/subscriptions')
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'Get system-wide subscriptions' })
  getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  @Get('billing/payments')
  @RequirePermission('billing', 'view')
  @ApiOperation({ summary: 'Get system-wide payment history' })
  getPayments() {
    return this.adminService.getPayments();
  }

  @Post('plans/seed')
  @RequirePermission('billing', 'edit')
  @ApiOperation({ summary: 'Seed canonical plans' })
  seedPlans() {
    return this.adminService.seedPlans();
  }
}

