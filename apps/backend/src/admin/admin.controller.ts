import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'account_manager', 'designer', 'reviewer')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get list of all users' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get details for a single user' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend or activate a user account' })
  suspendUser(
    @Param('id') id: string,
    @Body('suspend') suspend: boolean,
  ) {
    return this.adminService.suspendUser(id, suspend);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Permanently delete a user account' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('billing/stats')
  @ApiOperation({ summary: 'Get billing stats overview' })
  getBillingStats() {
    return this.adminService.getBillingStats();
  }

  @Get('billing/subscriptions')
  @ApiOperation({ summary: 'Get system-wide subscriptions' })
  getSubscriptions() {
    return this.adminService.getSubscriptions();
  }

  @Get('billing/payments')
  @ApiOperation({ summary: 'Get system-wide payment history' })
  getPayments() {
    return this.adminService.getPayments();
  }
}
