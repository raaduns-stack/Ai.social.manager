import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromptManagementService } from './prompt-management.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/prompt-management')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromptManagementController {
  constructor(
    private readonly promptManagementService: PromptManagementService,
  ) {}

  // ==========================================
  // Get all AI Prompt Templates
  // GET /api/admin/prompt-management
  // ==========================================
  @Get()
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'Get all AI prompt templates' })
  getAllPrompts() {
    return this.promptManagementService.getAllPrompts();
  }

  // ==================================================
  // GET AI FEEDBACK ANALYTICS
  // GET /api/admin/prompt-management/feedback-analytics
  // ==================================================
  @Get('feedback-analytics')
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'Get aggregate feedback analytics' })
  getFeedbackAnalytics() {
    return this.promptManagementService.getFeedbackAnalytics();
  }

  // ==================================================
  // GET CUSTOMER AI FEEDBACK ANALYTICS
  // GET /api/admin/prompt-management/customer-feedback
  // ==================================================
  @Get('customer-feedback')
  @RequirePermission('content_creation', 'view')
  @ApiOperation({ summary: 'Get feedback analysis grouped by customer' })
  getCustomerFeedbackAnalytics() {
    return this.promptManagementService.getCustomerFeedbackAnalytics();
  }

  // ==================================================
  // UPDATE AN AI PROMPT TEMPLATE
  // PATCH /api/admin/prompt-management/:id
  // ==================================================
  @Patch(':id')
  @RequirePermission('content_creation', 'edit')
  @ApiOperation({ summary: 'Update a prompt template' })
  updatePrompt(
    @Param('id') id: string,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptManagementService.updatePrompt(
      id,
      updatePromptDto,
    );
  }

  // ==================================================
  // TOGGLE AI PROMPT STATUS
  // PATCH /api/admin/prompt-management/:id/toggle
  // ==================================================
  @Patch(':id/toggle')
  @RequirePermission('content_creation', 'edit')
  @ApiOperation({ summary: 'Toggle prompt template status' })
  togglePrompt(@Param('id') id: string) {
    return this.promptManagementService.togglePrompt(id);
  }

  // ==================================================
  // DELETE AN AI PROMPT TEMPLATE
  // DELETE /api/admin/prompt-management/:id
  // ==================================================
  @Delete(':id')
  @RequirePermission('content_creation', 'delete')
  @ApiOperation({ summary: 'Delete a prompt template' })
  deletePrompt(@Param('id') id: string) {
    return this.promptManagementService.deletePrompt(id);
  }

  // ==========================================
  // Create a New AI Prompt Template
  // POST /api/admin/prompt-management
  // ==========================================
  @Post()
  @RequirePermission('content_creation', 'create')
  @ApiOperation({ summary: 'Create a new prompt template' })
  createPrompt(
    @Body() createPromptDto: CreatePromptDto,
  ) {
    return this.promptManagementService.createPrompt(createPromptDto);
  }
}