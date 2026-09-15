import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { DesignManagementService } from './design-management.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@ApiTags('Admin - Design Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin')
export class DesignManagementController {
  constructor(private readonly designService: DesignManagementService) {}

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

  @Get('design-tasks')
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'List all design tasks with filtering' })
  @ApiQuery({ name: 'designerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'in_progress', 'done'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high'] })
  async listTasks(
    @Query('designerId') designerId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.designService.listTasks({ designerId, status, priority });
  }

  @Post('design-tasks')
  @RequirePermission('content_creation', 'edit')
  @ApiOperation({ summary: 'Create and assign a new design task' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { userId?: string; id?: string },
    @Req() req: any,
  ) {
    const adminId = user?.userId || user?.id || req?.user?.userId || req?.user?.id;
    return this.designService.createTask(dto, adminId);
  }

  @Patch('design-tasks/:id')
  @RequirePermission('content_creation', 'edit')
  @ApiOperation({ summary: 'Update a design task' })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { userId?: string; id?: string },
    @Req() req: any,
  ) {
    const adminId = user?.userId || user?.id || req?.user?.userId || req?.user?.id;
    return this.designService.updateTask(id, dto, adminId);
  }

  @Delete('design-tasks/:id')
  @RequirePermission('content_creation', 'delete')
  @ApiOperation({ summary: 'Delete a design task' })
  async deleteTask(@Param('id') id: string) {
    return this.designService.deleteTask(id);
  }

  // ---------------------------------------------------------------------------
  // SUBMISSIONS & REVIEWS
  // ---------------------------------------------------------------------------

  @Get('design-submissions')
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'List all designer submissions with attachments and status' })
  @ApiQuery({ name: 'designerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  async listSubmissions(
    @Query('designerId') designerId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.designService.listSubmissions({ designerId, status, category });
  }

  @Get('design-submissions/:id')
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'Get full submission details with files and activity history' })
  async getSubmissionDetail(@Param('id') id: string) {
    return this.designService.getSubmissionDetail(id);
  }

  @Patch('design-submissions/:id/review')
  @RequirePermission('content_creation', 'edit')
  @ApiOperation({ summary: 'Review a submission (approve, request revisions, update notes)' })
  async reviewSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: { userId?: string; id?: string },
    @Req() req: any,
  ) {
    const adminId = user?.userId || user?.id || req?.user?.userId || req?.user?.id;
    return this.designService.reviewSubmission(id, dto, adminId);
  }
}
