import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminDesignerManagementController } from './designer-management.controller';
import { AdminDesignerManagementService } from './designer-management.service';
import { AdminSupportController } from './support/admin-support.controller';
import { SupportModule } from '../support/support.module';
import { AdminUploadsController } from './uploads/admin-uploads.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { PromptManagementModule } from './prompt-management/prompt-management.module';
import { AdminLoginHistoryController } from './login-history/admin-login-history.controller';
import { LoginHistoryModule } from '../login-history/login-history.module';
import { AdminActivityLogsController } from './activity-logs/admin-activity-logs.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    SupportModule,
    UploadsModule,
    PromptManagementModule,
    LoginHistoryModule,
    ActivityLogsModule,
    AuthModule,
  ],
  controllers: [
    AdminController,
    AdminDashboardController,
    AdminSupportController,
    AdminUploadsController,
    AdminLoginHistoryController,
    AdminActivityLogsController,
    AdminDesignerManagementController,
  ],
  providers: [
    AdminService,
    DashboardService,
    AdminDesignerManagementService,
  ],
  exports: [
    AdminService,
    DashboardService,
    AdminDesignerManagementService,
  ],
})
export class AdminModule { }