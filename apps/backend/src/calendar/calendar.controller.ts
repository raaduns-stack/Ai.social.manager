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
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  CalendarService,
  CreateCalendarPostDto,
  UpdateCalendarPostDto,
  UpdateApprovalDto,
} from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─── Customer routes ────────────────────────────────────────────────────────

  @Get('posts')
  @ApiOperation({ summary: '[Customer] Get all calendar posts for the current user' })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED'] })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('status') status?: string,
  ) {
    return this.calendarService.findAllForUser(user.userId, status);
  }

  @Get('posts/upcoming')
  @ApiOperation({ summary: '[Customer] Get upcoming (SCHEDULED) posts for the current user' })
  findUpcoming(@CurrentUser() user: { userId: string }) {
    return this.calendarService.findUpcomingForUser(user.userId);
  }

  @Get('posts/published')
  @ApiOperation({ summary: '[Customer] Get published posts for the current user' })
  findPublished(@CurrentUser() user: { userId: string }) {
    return this.calendarService.findPublishedForUser(user.userId);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '[Customer] Get a single post by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.calendarService.findOneForUser(id, user.userId);
  }

  @Post('posts')
  @ApiOperation({ summary: '[Customer] Schedule a new content calendar post' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCalendarPostDto,
  ) {
    return this.calendarService.createForUser(user.userId, dto);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: '[Customer] Update a content calendar post' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCalendarPostDto,
  ) {
    return this.calendarService.updateForUser(id, user.userId, dto);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '[Customer] Delete a calendar post' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.calendarService.removeForUser(id, user.userId);
  }

  // ─── Admin routes ────────────────────────────────────────────────────────────

  @Get('admin/customers')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'account_manager')
  @ApiOperation({ summary: '[Admin] List all customers who have calendar posts' })
  listCustomers() {
    return this.calendarService.listCustomers();
  }

  @Get('admin/posts')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'account_manager')
  @ApiOperation({ summary: '[Admin] Approval status metrics, optionally scoped to one user' })
  @ApiQuery({ name: 'userId', required: false })
  getAdminOverview(@Query('userId') userId?: string) {
    return this.calendarService.getApprovalOverview(userId);
  }

  @Patch('admin/posts/:id/approval')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'account_manager', 'designer', 'reviewer')
  @ApiOperation({ summary: '[Admin] Update approval status and leave notes on a post' })
  updateApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApprovalDto,
  ) {
    return this.calendarService.updateApproval(id, dto);
  }
}
