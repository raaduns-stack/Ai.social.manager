import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminSupportController } from './support/admin-support.controller';
import { SupportModule } from '../support/support.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [DatabaseModule, SupportModule],
  controllers: [AdminController, AdminDashboardController, AdminSupportController, AnalyticsController],
  providers: [AdminService, DashboardService, AnalyticsService],
  exports: [AdminService, DashboardService, AnalyticsService],
})
export class AdminModule {}

