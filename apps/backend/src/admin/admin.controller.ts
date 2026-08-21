import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get list of all users with search, filters and ordering' })
  getUsers(
    @Query('search') search?: string,
    @Query('tab') tab?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('country') country?: string,
    @Query('kycStatus') kycStatus?: string,
  ) {
    return this.adminService.getUsers({ search, tab, status, plan, country, kycStatus });
  }

  @Get('users/stats')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get calculated User Management statistics counters' })
  getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('users/staff-managers')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get list of staff members for account manager assignment' })
  getStaffManagers() {
    return this.adminService.getStaffManagers();
  }

  @Get('users/:id')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Get full details for a single user' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Create a new user account' })
  createUser(
    @Body()
    body: {
      fullName: string;
      email: string;
      password?: string;
      businessName?: string;
      phoneNumber?: string;
      country?: string;
      role?: UserRole;
      accountStatus?: 'ACTIVE' | 'EMAIL_VERIFICATION_PENDING';
      accountManagerId?: string;
    },
  ) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Update user information' })
  updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      businessName?: string;
      phoneNumber?: string;
      country?: string;
      role?: UserRole;
      accountManagerId?: string;
    },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/:id/suspend')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Suspend or activate a user account' })
  suspendUser(@Param('id') id: string, @Body('suspend') suspend: boolean) {
    return this.adminService.suspendUser(id, suspend);
  }

  @Delete('users/:id')
  @RequirePermission('user_management', 'delete')
  @ApiOperation({ summary: 'Delete or soft-delete a user account' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/account-manager')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Assign an account manager to a customer user' })
  assignAccountManager(
    @Param('id') id: string,
    @Body('accountManagerId') accountManagerId: string | null,
  ) {
    return this.adminService.assignAccountManager(id, accountManagerId);
  }

  @Post('users/:id/profile-image')
  @RequirePermission('user_management', 'edit')
  @ApiOperation({ summary: 'Upload profile image for user' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only JPG, JPEG, PNG, and WebP images are allowed'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadUserProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No image file uploaded');
    return this.adminService.updateProfileImage(id, file.filename);
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
