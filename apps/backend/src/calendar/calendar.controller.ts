import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import {
  CalendarService,
  CreateCalendarPostDto,
  UpdateCalendarPostDto,
  UpdateApprovalDto,
} from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrN8nAuthGuard } from '../auth/guards/jwt-or-n8n-auth.guard';
import { N8nInternalAuthGuard } from '../auth/guards/n8n-internal-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─── Customer routes ────────────────────────────────────────────────────────

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Get all calendar posts for the current user' })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED'] })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('status') status?: string,
  ) {
    return this.calendarService.findAllForUser(user.userId, status);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Get monthly post limit and usage stats' })
  @ApiQuery({ name: 'month', required: false, description: 'Target month in YYYY-MM format' })
  getUsage(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: string,
  ) {
    return this.calendarService.getUsageForUser(user.userId, month);
  }

  @Get('posts/upcoming')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Get upcoming (SCHEDULED) posts for the current user' })
  findUpcoming(@CurrentUser() user: { userId: string }) {
    return this.calendarService.findUpcomingForUser(user.userId);
  }

  @Get('posts/published')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Get published posts for the current user' })
  findPublished(@CurrentUser() user: { userId: string }) {
    return this.calendarService.findPublishedForUser(user.userId);
  }

  @Get('posts/:id')
  @UseGuards(JwtOrN8nAuthGuard)
  @ApiOperation({ summary: '[Customer/n8n] Get a single post by ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional userId for ownership verification when called by internal services' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: { userId: string },
    @Query('userId') queryUserId?: string,
  ) {
    const targetUserId = user?.userId || queryUserId;
    if (targetUserId) {
      return this.calendarService.findOneForUser(id, targetUserId);
    }
    return this.calendarService.findOneById(id);
  }

  @Get('internal/posts/:id')
  @UseGuards(N8nInternalAuthGuard)
  @ApiHeader({ name: 'X-N8N-API-KEY', description: 'Internal n8n API Key' })
  @ApiOperation({ summary: '[Internal n8n] Get a single post by ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional userId for ownership verification' })
  findInternal(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      return this.calendarService.findOneForUser(id, userId);
    }
    return this.calendarService.findOneById(id);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Schedule a new content calendar post' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCalendarPostDto,
  ) {
    return this.calendarService.createForUser(user.userId, dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Update a content calendar post' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCalendarPostDto,
  ) {
    return this.calendarService.updateForUser(id, user.userId, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Customer] Delete a calendar post' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.calendarService.removeForUser(id, user.userId);
  }

  // ─── Admin routes ────────────────────────────────────────────────────────────

  @Get('admin/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'account_manager')
  @ApiOperation({ summary: '[Admin] List all customers who have calendar posts' })
  listCustomers() {
    return this.calendarService.listCustomers();
  }

  @Get('admin/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'account_manager')
  @ApiOperation({ summary: '[Admin] Get all posts, optionally filtered by userId and/or approvalStatus' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by customer UUID' })
  @ApiQuery({ name: 'approvalStatus', required: false, enum: ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'] })
  findAllAdmin(
    @Query('userId') userId?: string,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.calendarService.findAllForAdmin(userId, approvalStatus);
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'account_manager')
  @ApiOperation({ summary: '[Admin] Approval status metrics, optionally scoped to one user' })
  @ApiQuery({ name: 'userId', required: false })
  getAdminOverview(@Query('userId') userId?: string) {
    return this.calendarService.getApprovalOverview(userId);
  }

  @Patch('admin/posts/:id/approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'account_manager', 'designer', 'reviewer')
  @ApiOperation({ summary: '[Admin] Update approval status and leave notes on a post' })
  updateApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApprovalDto,
  ) {
    return this.calendarService.updateApproval(id, dto);
  }
}
