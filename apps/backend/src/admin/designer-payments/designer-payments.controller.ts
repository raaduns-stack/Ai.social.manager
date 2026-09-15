import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { DesignerPaymentsService } from './designer-payments.service';
import { UpdateDesignerPaymentSettingsDto } from './dto/update-designer-payment-settings.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';

@ApiTags('admin-designer-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ACCOUNT_MANAGER, UserRole.REVIEWER)
@Controller('admin/designer-payments')
export class DesignerPaymentsController {
  constructor(private readonly designerPaymentsService: DesignerPaymentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get designer payments overview KPI statistics' })
  async getDashboard() {
    return this.designerPaymentsService.getDashboardStats();
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get per-designer calculated earnings based on approved work' })
  async getDesignerEarnings() {
    return this.designerPaymentsService.getDesignerEarnings();
  }

  @Get('records')
  @ApiOperation({ summary: 'Get all designer payout and payment records' })
  async getPaymentRecords(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('designerId') designerId?: string,
  ) {
    return this.designerPaymentsService.getPaymentRecords({ status, search, designerId });
  }

  @Post('records')
  @ApiOperation({ summary: 'Create / initiate a new designer payout' })
  async createPayout(@Body() dto: CreatePayoutDto, @Request() req: any) {
    return this.designerPaymentsService.createPayout(dto, req.user?.userId || req.user?.id);
  }

  @Patch('records/:id/status')
  @ApiOperation({ summary: 'Update status of a designer payment record (approve, decline, process, mark successful/failed)' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePayoutStatusDto,
    @Request() req: any,
  ) {
    return this.designerPaymentsService.updatePaymentStatus(id, dto, req.user?.userId || req.user?.id);
  }

  @Delete('records/:id')
  @ApiOperation({ summary: 'Delete a designer payment record' })
  async deletePaymentRecord(@Param('id') id: string) {
    return this.designerPaymentsService.deletePaymentRecord(id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get global designer payment and payout settings' })
  async getSettings() {
    return this.designerPaymentsService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update global designer payment and payout settings' })
  async updateSettings(@Body() dto: UpdateDesignerPaymentSettingsDto) {
    return this.designerPaymentsService.updateSettings(dto);
  }
}
