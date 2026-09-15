import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('invoice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoice')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices for the logged-in user' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.invoicesService.findAllByUser(user.userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download single invoice as PDF stream' })
  async downloadPdf(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOneByUser(id, user.userId);
    const pdfBuffer = await this.invoicesService.generateInvoicePdf(id, user.userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single invoice detail by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.invoicesService.findOneByUser(id, user.userId);
  }
}
