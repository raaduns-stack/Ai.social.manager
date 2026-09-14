import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { DesignerService } from './designer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { UpdateImageToCodeDto } from './dto/update-image-to-code.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('designer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DESIGNER)
@Controller('designer')
export class DesignerController {
  constructor(private readonly designerService: DesignerService) {}

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Get designer dashboard summary' })
  getDashboardSummary(@CurrentUser() user: { userId: string }) {
    return this.designerService.getDashboardSummary(user.userId);
  }

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  @Get('profile')
  @ApiOperation({ summary: 'Get designer profile' })
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.designerService.getProfile(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update designer profile' })
  updateProfile(@CurrentUser() user: { userId: string }, @Body() dto: UpdateProfileDto) {
    return this.designerService.updateProfile(user.userId, dto);
  }

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

  @Get('tasks')
  @ApiOperation({ summary: 'List assigned tasks' })
  getTasks(@CurrentUser() user: { userId: string }) {
    return this.designerService.getTasks(user.userId);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status' })
  updateTaskStatus(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.designerService.updateTaskStatus(user.userId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // SUBMISSIONS
  // ---------------------------------------------------------------------------

  @Get('submissions')
  @ApiOperation({ summary: 'List submissions' })
  getSubmissions(@CurrentUser() user: { userId: string }) {
    return this.designerService.getSubmissions(user.userId);
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Create submission with optional file uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        taskId: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['title'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5))
  createSubmission(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSubmissionDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.designerService.createSubmission(user.userId, dto, files);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get single submission by ID' })
  getSubmissionById(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.designerService.getSubmissionById(user.userId, id);
  }

  @Put('submissions/:id')
  @ApiOperation({ summary: 'Update submission' })
  updateSubmission(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.designerService.updateSubmission(user.userId, id, dto);
  }

  @Post('submissions/:id/submit')
  @ApiOperation({ summary: 'Submit or resubmit a submission for review' })
  submitSubmission(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.designerService.submitSubmission(user.userId, id);
  }

  @Get('submissions/:id/activity')
  @ApiOperation({ summary: 'Get submission activity log' })
  getSubmissionActivity(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.designerService.getSubmissionActivity(user.userId, id);
  }

  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------

  @Get('payments')
  @ApiOperation({ summary: 'List payout history' })
  getPayments(@CurrentUser() user: { userId: string }) {
    return this.designerService.getPayments(user.userId);
  }

  @Get('payments/method')
  @ApiOperation({ summary: 'Get saved payment method' })
  getPaymentMethod(@CurrentUser() user: { userId: string }) {
    return this.designerService.getPaymentMethod(user.userId);
  }

  @Put('payments/method')
  @ApiOperation({ summary: 'Update payment method' })
  updatePaymentMethod(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.designerService.updatePaymentMethod(user.userId, dto);
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications' })
  getNotifications(@CurrentUser() user: { userId: string }) {
    return this.designerService.getNotifications(user.userId);
  }

  @Put('notifications/:id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markNotificationRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.designerService.markNotificationRead(user.userId, id);
  }

  @Put('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllNotificationsRead(@CurrentUser() user: { userId: string }) {
    return this.designerService.markAllNotificationsRead(user.userId);
  }

  @Get('notifications/preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getNotificationPreferences(@CurrentUser() user: { userId: string }) {
    return this.designerService.getNotificationPreferences(user.userId);
  }

  @Put('notifications/preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotificationPreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.designerService.updateNotificationPreferences(user.userId, dto);
  }

  // ---------------------------------------------------------------------------
  // SECURITY
  // ---------------------------------------------------------------------------

  @Put('security/password')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@CurrentUser() user: { userId: string }, @Body() dto: ChangePasswordDto) {
    return this.designerService.changePassword(user.userId, dto);
  }

  // ---------------------------------------------------------------------------
  // IMAGE-TO-CODE
  // ---------------------------------------------------------------------------

  @Get('image-to-code')
  @ApiOperation({ summary: 'List image-to-code conversions' })
  getImageToCodeConversions(@CurrentUser() user: { userId: string }) {
    return this.designerService.getImageToCodeConversions(user.userId);
  }

  @Put('image-to-code/:id')
  @ApiOperation({ summary: 'Update image-to-code draft' })
  updateImageToCode(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateImageToCodeDto,
  ) {
    return this.designerService.updateImageToCode(user.userId, id, dto);
  }

  @Post('image-to-code/:id/submit')
  @ApiOperation({ summary: 'Submit image-to-code for review' })
  submitImageToCode(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.designerService.submitImageToCode(user.userId, id);
  }
}
