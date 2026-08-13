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
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/prompt-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'account_manager')
export class PromptManagementController {
  constructor(
    private readonly promptManagementService: PromptManagementService,
  ) {}

  // ==========================================
  // Get all AI Prompt Templates
  // GET /api/admin/prompt-management
  // ==========================================
  @Get()
  @ApiOperation({ summary: 'Get all AI prompt templates' })
  getAllPrompts() {
    return this.promptManagementService.getAllPrompts();
  }

  // ==================================================
  // GET AI FEEDBACK ANALYTICS
  // GET /api/admin/prompt-management/feedback-analytics
  // ==================================================
  @Get('feedback-analytics')
  @ApiOperation({ summary: 'Get aggregate feedback analytics' })
  getFeedbackAnalytics() {
    return this.promptManagementService.getFeedbackAnalytics();
  }

  // ==================================================
  // GET CUSTOMER AI FEEDBACK ANALYTICS
  // GET /api/admin/prompt-management/customer-feedback
  // ==================================================
  @Get('customer-feedback')
  @ApiOperation({ summary: 'Get feedback analysis grouped by customer' })
  getCustomerFeedbackAnalytics() {
    return this.promptManagementService.getCustomerFeedbackAnalytics();
  }

  // ==================================================
  // UPDATE AN AI PROMPT TEMPLATE
  // PATCH /api/admin/prompt-management/:id
  // ==================================================
  @Patch(':id')
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
  @ApiOperation({ summary: 'Toggle prompt template status' })
  togglePrompt(@Param('id') id: string) {
    return this.promptManagementService.togglePrompt(id);
  }

  // ==================================================
  // DELETE AN AI PROMPT TEMPLATE
  // DELETE /api/admin/prompt-management/:id
  // ==================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a prompt template' })
  deletePrompt(@Param('id') id: string) {
    return this.promptManagementService.deletePrompt(id);
  }

  // ==========================================
  // Create a New AI Prompt Template
  // POST /api/admin/prompt-management
  // ==========================================
  @Post()
  @ApiOperation({ summary: 'Create a new prompt template' })
  createPrompt(
    @Body() createPromptDto: CreatePromptDto,
  ) {
    return this.promptManagementService.createPrompt(createPromptDto);
  }
}