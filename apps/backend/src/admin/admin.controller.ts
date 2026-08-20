import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AdminService } from './admin.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

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

  @Get('role-permissions')
  @RequirePermission('staff_management', 'view')
  @ApiOperation({ summary: 'Get all role permissions' })
  getRolePermissions() {
    return this.adminService.getRolePermissions();
  }

  @Patch('role-permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update permissions for a specific role' })
  updateRolePermissions(@Body() dto: UpdateRolePermissionsDto) {
    return this.adminService.updateRolePermissions(dto);
  }

  @Post('users/staff')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new staff/admin account' })
  createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaff(dto);
  }

  @Get('staff/overview')
  @RequirePermission('staff_management', 'view')
  @ApiOperation({ summary: 'Staff dashboard counts and recent staff logins' })
  getStaffOverview() {
    return this.adminService.getStaffOverview();
  }

  @Get('plans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all subscription plans' })
  getPlans() {
    return this.adminService.getPlans();
  }

  @Patch('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updatePlan(id, dto);
  }

  @Get('social-accounts')
  @RequirePermission('social_accounts', 'view')
  @ApiOperation({ summary: 'Get all user social accounts' })
  getSocialAccounts() {
    return this.adminService.getSocialAccounts();
  }

  @Post('social-accounts/:id/disconnect')
  @RequirePermission('social_accounts', 'edit')
  @ApiOperation({ summary: 'Disconnect a user social account' })
  disconnectSocialAccount(@Param('id') id: string) {
    return this.adminService.disconnectSocialAccount(id);
  }
}

