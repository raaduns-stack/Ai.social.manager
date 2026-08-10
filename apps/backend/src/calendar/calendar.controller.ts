import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  CalendarService,
  CreateCalendarPostDto,
  UpdateApprovalDto,
} from './calendar.service';

// ---------------------------------------------------------------------------
// TEMPORARY: hard-coded user UUID for testing until JWT auth guards are wired.
// Replace with @Req() user.id from the JWT guard when auth is connected.
// ---------------------------------------------------------------------------
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'; // placeholder

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─── Customer routes ────────────────────────────────────────────────────────

  @Get('posts')
  @ApiOperation({ summary: '[Customer] Get all calendar posts for the current user' })
  @ApiQuery({ name: 'userId', required: false, description: 'UUID of the user (temp — will come from JWT)' })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED'] })
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    // TODO: replace userId query param with JWT guard: const userId = req.user.id
    return this.calendarService.findAllForUser(userId ?? DEV_USER_ID, status);
  }

  @Get('posts/upcoming')
  @ApiOperation({ summary: '[Customer] Get upcoming (SCHEDULED) posts for the current user' })
  @ApiQuery({ name: 'userId', required: false })
  findUpcoming(@Query('userId') userId?: string) {
    return this.calendarService.findUpcomingForUser(userId ?? DEV_USER_ID);
  }

  @Get('posts/published')
  @ApiOperation({ summary: '[Customer] Get published posts for the current user' })
  @ApiQuery({ name: 'userId', required: false })
  findPublished(@Query('userId') userId?: string) {
    return this.calendarService.findPublishedForUser(userId ?? DEV_USER_ID);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '[Customer] Get a single post by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.calendarService.findOneForUser(id, userId ?? DEV_USER_ID);
  }

  @Post('posts')
  @ApiOperation({ summary: '[Customer] Schedule a new content calendar post' })
  create(
    @Body() dto: CreateCalendarPostDto,
    @Query('userId') userId?: string,
  ) {
    return this.calendarService.createForUser(userId ?? DEV_USER_ID, dto);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '[Customer] Delete a calendar post' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.calendarService.removeForUser(id, userId ?? DEV_USER_ID);
  }

  // ─── Admin routes ────────────────────────────────────────────────────────────

  @Get('admin/customers')
  @ApiOperation({ summary: '[Admin] List all customers who have calendar posts' })
  listCustomers() {
    return this.calendarService.listCustomers();
  }

  @Get('admin/posts')
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
  @ApiOperation({ summary: '[Admin] Approval status metrics, optionally scoped to one user' })
  @ApiQuery({ name: 'userId', required: false })
  getAdminOverview(@Query('userId') userId?: string) {
    return this.calendarService.getApprovalOverview(userId);
  }

  @Patch('admin/posts/:id/approval')
  @ApiOperation({ summary: '[Admin] Update approval status and leave notes on a post' })
  updateApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApprovalDto,
  ) {
    return this.calendarService.updateApproval(id, dto);
  }
}
