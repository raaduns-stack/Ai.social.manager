import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@ApiTags('admin-faqs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'account_manager')
@Controller('admin/faqs')
export class FaqsAdminController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all FAQs for admin management (including unpublished)' })
  getAllFaqs() {
    return this.faqsService.getAllFaqsForAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new FAQ' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqsService.createFaq(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing FAQ' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.updateFaq(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an FAQ' })
  deleteFaq(@Param('id') id: string) {
    return this.faqsService.deleteFaq(id);
  }
}
