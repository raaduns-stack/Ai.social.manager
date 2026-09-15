import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminSupportController } from './support/admin-support.controller';
import { SupportModule } from '../support/support.module';
import { AdminUploadsController } from './uploads/admin-uploads.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { PromptManagementModule } from './prompt-management/prompt-management.module';
import { AdminLoginHistoryController } from './login-history/admin-login-history.controller';
import { LoginHistoryModule } from '../login-history/login-history.module';
import { AdminActivityLogsController } from './activity-logs/admin-activity-logs.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { AdminGraphicsController } from './graphics/graphics.controller';
import { AdminGraphicsService } from './graphics/graphics.service';
import { AuthModule } from '../auth/auth.module';
import { DesignerPaymentsController } from './designer-payments/designer-payments.controller';
import { DesignerPaymentsService } from './designer-payments/designer-payments.service';
import { DesignReportsController } from './design-reports/design-reports.controller';
import { DesignReportsService } from './design-reports/design-reports.service';
import { DesignManagementController } from './design-management/design-management.controller';
import { DesignManagementService } from './design-management/design-management.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    SupportModule,
    UploadsModule,
    PromptManagementModule,
    LoginHistoryModule,
    ActivityLogsModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [
    AdminController,
    AdminDashboardController,
    AdminSupportController,
    AdminUploadsController,
    AdminLoginHistoryController,
    AdminActivityLogsController,
    AdminGraphicsController,
    DesignerPaymentsController,
    DesignReportsController,
    DesignManagementController,
  ],
  providers: [
    AdminService,
    DashboardService,
    AdminGraphicsService,
    DesignerPaymentsService,
    DesignReportsService,
    DesignManagementService,
  ],
  exports: [
    AdminService,
    DashboardService,
    AdminGraphicsService,
    DesignerPaymentsService,
    DesignReportsService,
    DesignManagementService,
  ],
})
export class AdminModule { }
