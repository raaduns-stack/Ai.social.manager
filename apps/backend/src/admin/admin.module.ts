import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminService, DashboardService],
  exports: [AdminService, DashboardService],
})
export class AdminModule {}
