import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PromptManagementModule } from './prompt-management/prompt-management.module';

@Module({
  imports: [DatabaseModule, PromptManagementModule],
  controllers: [AdminController, DashboardController],
  providers: [AdminService, DashboardService],
  exports: [AdminService, DashboardService],
})
export class AdminModule {}
