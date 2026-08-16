import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@ApiTags('admin-faqs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/faqs')
export class FaqsAdminController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  @RequirePermission('support', 'view')
  @ApiOperation({ summary: 'Get all FAQs for admin management (including unpublished)' })
  getAllFaqs() {
    return this.faqsService.getAllFaqsForAdmin();
  }

  @Post()
  @RequirePermission('support', 'manage')
  @ApiOperation({ summary: 'Create a new FAQ' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqsService.createFaq(dto);
  }

  @Put(':id')
  @RequirePermission('support', 'manage')
  @ApiOperation({ summary: 'Update an existing FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.updateFaq(id, dto);
  }

  @Delete(':id')
  @RequirePermission('support', 'manage')
  @ApiOperation({ summary: 'Delete an FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.faqsService.deleteFaq(id);
  }
}

