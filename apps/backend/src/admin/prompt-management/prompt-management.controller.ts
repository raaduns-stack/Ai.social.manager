import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PromptManagementService } from './prompt-management.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@ApiTags('admin')
@Controller('admin/prompt-management')
export class PromptManagementController {
  constructor(
    private readonly promptManagementService: PromptManagementService,
  ) {}

  // ==========================================
  // Get all AI Prompt Templates
  // GET /api/admin/prompt-management
  // ==========================================
  @Get()
  getAllPrompts() {
    return this.promptManagementService.getAllPrompts();
  }
  // ==================================================
// UPDATE AN AI PROMPT TEMPLATE
// PATCH /api/admin/prompt-management/:id
// ==================================================
@Patch(':id')
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
// DELETE AN AI PROMPT TEMPLATE
// DELETE /api/admin/prompt-management/:id
// ==================================================
@Delete(':id')
deletePrompt(@Param('id') id: string) {
  return this.promptManagementService.deletePrompt(id);
}

  // ==========================================
  // Create a New AI Prompt Template
  // POST /api/admin/prompt-management
  // ==========================================
  @Post()
  createPrompt(
    @Body() createPromptDto: CreatePromptDto,
  ) {
    return this.promptManagementService.createPrompt(createPromptDto);
  }
}