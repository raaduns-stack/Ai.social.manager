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

@Module({
  imports: [DatabaseModule, SupportModule, UploadsModule],
  controllers: [AdminController, AdminDashboardController, AdminSupportController, AdminUploadsController],
  providers: [AdminService, DashboardService],
  exports: [AdminService, DashboardService],
})
export class AdminModule { }