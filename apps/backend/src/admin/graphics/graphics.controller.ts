/**
 * graphics.controller.ts
 * ---------------------------------------------------------------------------
 * Admin graphics workspace endpoints (FeatureList GRAPHICS §3/§4/§5) mounted
 * inside the existing admin API surface: /api/admin/graphics/*.
 *
 * Guarded by JwtAuthGuard + PermissionsGuard with the `graphics_management`
 * module key (seeded in database/seeding.ts). Mirrors the
 * AdminUploadsController pattern: view for reads, create/edit/delete for
 * task writes, approve for review decisions.
 * ---------------------------------------------------------------------------
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminGraphicsService } from './graphics.service';
import { CreateGraphicsTaskDto } from './dto/create-task.dto';
import { UpdateGraphicsTaskDto } from './dto/update-task.dto';
import { ReviewGraphicsSubmissionDto } from './dto/review-submission.dto';
import { ReviewGraphicsConversionDto } from './dto/review-conversion.dto';
import { CreateGraphicsConversionDto } from './dto/create-conversion.dto';

@ApiTags('admin-graphics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/graphics')
export class AdminGraphicsController {
  constructor(private readonly graphicsService: AdminGraphicsService) {}

  // -------------------------------------------------------------------------
  // DESIGNERS
  // -------------------------------------------------------------------------

  @Get('designers')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({ summary: 'List designer accounts for task assignment' })
  listDesigners() {
    return this.graphicsService.listDesigners();
  }

  // -------------------------------------------------------------------------
  // TASKS (§3)
  // -------------------------------------------------------------------------

  @Get('tasks')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({
    summary: 'List all design tasks (filterable by status, priority, designer, search)',
  })
  listTasks(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('designerId') designerId?: string,
    @Query('search') search?: string,
  ) {
    return this.graphicsService.listTasks({ status, priority, designerId, search });
  }

  @Get('tasks/:id')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({
    summary: 'Get task details with assignee, linked submissions and derived timeline',
  })
  getTaskById(@Param('id') id: string) {
    return this.graphicsService.getTaskById(id);
  }

  @Post('tasks')
  @RequirePermission('graphics_management', 'create')
  @ApiOperation({ summary: 'Create a design task and assign it to a designer' })
  createTask(@CurrentUser() admin: { userId: string }, @Body() dto: CreateGraphicsTaskDto) {
    return this.graphicsService.createTask(admin.userId, dto);
  }

  @Patch('tasks/:id')
  @RequirePermission('graphics_management', 'edit')
  @ApiOperation({ summary: 'Edit, reassign or change the status of a design task' })
  updateTask(
    @CurrentUser() admin: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateGraphicsTaskDto,
  ) {
    return this.graphicsService.updateTask(admin.userId, id, dto);
  }

  @Delete('tasks/:id')
  @RequirePermission('graphics_management', 'delete')
  @ApiOperation({ summary: 'Delete a design task (linked submissions are preserved)' })
  deleteTask(@Param('id') id: string) {
    return this.graphicsService.deleteTask(id);
  }

  // -------------------------------------------------------------------------
  // SUBMISSIONS (§4)
  // -------------------------------------------------------------------------

  @Get('submissions')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({
    summary: 'List all design submissions (filterable by status, category, designer, search)',
  })
  listSubmissions(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('designerId') designerId?: string,
    @Query('search') search?: string,
  ) {
    return this.graphicsService.listSubmissions({ status, category, designerId, search });
  }

  @Get('submissions/:id')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({ summary: 'Get submission details with files and approval history' })
  getSubmissionById(@Param('id') id: string) {
    return this.graphicsService.getSubmissionById(id);
  }

  @Patch('submissions/:id/review')
  @RequirePermission('graphics_management', 'approve')
  @ApiOperation({
    summary: 'Review a submission (received / under review / revision / approve / complete)',
  })
  reviewSubmission(
    @CurrentUser() admin: { userId: string },
    @Param('id') id: string,
    @Body() dto: ReviewGraphicsSubmissionDto,
  ) {
    return this.graphicsService.reviewSubmission(admin.userId, id, dto);
  }

  // -------------------------------------------------------------------------
  // IMAGE-TO-CODE (§5)
  // -------------------------------------------------------------------------

  @Get('image-to-code')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({ summary: 'List image-to-code conversions (filterable by status, search)' })
  listConversions(@Query('status') status?: string, @Query('search') search?: string) {
    return this.graphicsService.listConversions({ status, search });
  }

  @Post('image-to-code')
  @RequirePermission('graphics_management', 'create')
  @ApiOperation({ summary: 'Request a code conversion for an approved design' })
  requestConversion(
    @CurrentUser() admin: { userId: string },
    @Body() dto: CreateGraphicsConversionDto,
  ) {
    return this.graphicsService.requestConversion(admin.userId, dto.submissionId);
  }

  @Post('image-to-code/backfill')
  @RequirePermission('graphics_management', 'create')
  @ApiOperation({ summary: 'Mint conversion rows for already-approved designs missing one' })
  backfillConversions() {
    return this.graphicsService.backfillConversions();
  }

  @Get('image-to-code/:id')
  @RequirePermission('graphics_management', 'view')
  @ApiOperation({ summary: 'Get conversion details with code, assets and history' })
  getConversionById(@Param('id') id: string) {
    return this.graphicsService.getConversionById(id);
  }

  @Patch('image-to-code/:id/review')
  @RequirePermission('graphics_management', 'approve')
  @ApiOperation({ summary: 'Review a conversion (accept or request revision with note)' })
  reviewConversion(
    @CurrentUser() admin: { userId: string },
    @Param('id') id: string,
    @Body() dto: ReviewGraphicsConversionDto,
  ) {
    return this.graphicsService.reviewConversion(admin.userId, id, dto);
  }
}
