import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { N8nInternalAuthGuard } from '../auth/guards/n8n-internal-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ─── DTO Definitions ─────────────────────────────────────────────────────────

export class GenerateCalendarRequestDto {
  @ApiProperty({ example: '2026-09' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month!: string;

  @ApiProperty({ example: ['Instagram', 'Facebook'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  platforms!: string[];
}

export class GeneratedPostDto {
  @ApiProperty({ example: 'Social Media Strategy' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Boost your reach with this one simple trick...' })
  @IsString()
  @IsNotEmpty()
  caption!: string;

  @ApiProperty({ example: 'Facebook', required: false })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({ example: '2026-09-01', required: false })
  @IsString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @ApiProperty({ example: ['#marketing', '#socialmedia'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];
}

export class N8nGenerationResultDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: '2026-09' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month!: string;

  @ApiProperty({ type: [GeneratedPostDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedPostDto)
  posts!: GeneratedPostDto[];
}

// ─── Controller ─────────────────────────────────────────────────────────────

@ApiTags('Calendar Generation')
@Controller('calendar')
export class CalendarGenerationController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Customer] Request AI content calendar generation' })
  @ApiResponse({ status: 201, description: 'Generation job created and n8n triggered successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or monthly limits exceeded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async generate(
    @CurrentUser() user: { userId: string },
    @Body() dto: GenerateCalendarRequestDto,
  ) {
    return this.calendarService.createGenerationJob(user.userId, dto);
  }

  @Get('generation/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Customer] Check status of an AI content calendar generation job' })
  @ApiResponse({ status: 200, description: 'Current job status.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async getJobStatus(
    @CurrentUser() user: { userId: string },
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.calendarService.getJobStatus(jobId, user.userId);
  }

  @Get('generation-context/:customerId')
  @UseGuards(N8nInternalAuthGuard)
  @ApiHeader({ name: 'X-N8N-API-KEY', description: 'Internal n8n API Key' })
  @ApiOperation({ summary: '[Internal n8n] Get customer company profile and job context' })
  @ApiResponse({ status: 200, description: 'Business description, requested month & platforms.' })
  @ApiResponse({ status: 401, description: 'Unauthorized internal token.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  async getContext(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.calendarService.getGenerationContext(customerId);
  }

  @Post('generation/:jobId/result')
  @UseGuards(N8nInternalAuthGuard)
  @ApiHeader({ name: 'X-N8N-API-KEY', description: 'Internal n8n API Key' })
  @ApiOperation({ summary: '[Internal n8n] Submit generated content calendar posts for saving' })
  @ApiResponse({ status: 201, description: 'Posts successfully validated and saved to content calendar.' })
  @ApiResponse({ status: 400, description: 'Validation failed or limits exceeded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized internal token.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async saveResult(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: N8nGenerationResultDto,
  ) {
    return this.calendarService.handleN8nResult(jobId, dto);
  }
}
