import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminSupportController } from './support/admin-support.controller';
import { SupportModule } from '../support/support.module';
import { PromptManagementModule } from './prompt-management/prompt-management.module';

@Module({
  imports: [DatabaseModule, SupportModule, PromptManagementModule],
  controllers: [AdminController, AdminDashboardController, AdminSupportController],
  providers: [AdminService, DashboardService],
  exports: [AdminService, DashboardService],
})
export class AdminModule {}

