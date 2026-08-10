import { Module } from '@nestjs/common';
import { PromptManagementController } from './prompt-management.controller';
import { PromptManagementService } from './prompt-management.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PromptManagementController],
  providers: [PromptManagementService],
})
export class PromptManagementModule {}