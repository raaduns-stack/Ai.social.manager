/**
 * kyc.controller.ts
 * ---------------------------------------------------------------------------
 * HTTP layer for the KYC feature.
 *
 * Route split:
 *   /kyc/*         — customer-facing (JWT guard, own data only)
 *   /admin/kyc/*   — admin-facing (JWT + RolesGuard, admin roles only)
 *
 * Document uploads use the same MultipartInterceptor approach as the existing
 * uploads.module.ts (Multer + disk storage), but with AnyFilesInterceptor so
 * we can accept multiple named file fields in one request.
 * ---------------------------------------------------------------------------
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join, extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ALL_ADMIN_ROLES } from '../common/enums/roles.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

// ---------------------------------------------------------------------------
// Customer-facing KYC controller  —  /kyc
// ---------------------------------------------------------------------------
@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * GET /kyc/me
   * Returns the current user's KYC record (or null when none submitted yet).
   * The frontend Channels page polls this to decide which overlay to show.
   */
  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's KYC status and data" })
  getMyKyc(@CurrentUser() user: { userId: string }) {
    return this.kycService.getMyKyc(user.userId);
  }

  /**
   * POST /kyc/submit
   * Submit KYC business information + up to 3 document files.
   *
   * Accepted file fields:
   *   certOfRegistration  — Certificate of Registration / Incorporation
   *   utilityBill         — Utility Bill / Proof of Business Address
   *   ownerId             — Government-issued ID of owner/representative
   *
   * Files are saved to disk via the KycModule's Multer config (same pattern
   * as the existing UploadsModule).
   */
  @Post('submit')
  @ApiOperation({ summary: 'Submit or re-submit KYC with business information and documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        businessName: { type: 'string' },
        registrationNumber: { type: 'string' },
        businessType: { type: 'string' },
        businessAddress: { type: 'string' },
        country: { type: 'string' },
        businessEmail: { type: 'string' },
        businessPhone: { type: 'string' },
        businessDescription: { type: 'string' },
        certOfRegistration: { type: 'string', format: 'binary' },
        utilityBill: { type: 'string', format: 'binary' },
        ownerId: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'certOfRegistration', maxCount: 1 },
        { name: 'utilityBill', maxCount: 1 },
        { name: 'ownerId', maxCount: 1 },
      ],
    ),
  )
  async submitKyc(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitKycDto,
    @UploadedFiles()
    files: {
      certOfRegistration?: Express.Multer.File[];
      utilityBill?: Express.Multer.File[];
      ownerId?: Express.Multer.File[];
    },
  ) {
    return this.kycService.submitKyc(user.userId, dto, files ?? {});
  }

  /**
   * GET /kyc/me/document/:docType
   * Streams a KYC document file back to the authenticated user for their own record.
   * docType: 'cert' | 'utility' | 'ownerId'
   *
   * Documents are served via streaming (not public URL) to prevent exposure.
   */
  @Get('me/document/:docType')
  @ApiOperation({ summary: "Download one of the authenticated user's own KYC documents" })
  async downloadMyDocument(
    @CurrentUser() user: { userId: string },
    @Param('docType') docType: string,
    @Res() res: Response,
  ) {
    // Resolve the user's own KYC id first
    const kycRecord = await this.kycService.getMyKyc(user.userId);
    if (!kycRecord) throw new NotFoundException('No KYC record found');

    const filename = await this.kycService.getDocumentPath(
      kycRecord.id,
      docType as 'cert' | 'utility' | 'ownerId',
      user.userId,
      false, // not admin
    );

    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) throw new NotFoundException('Document file not found on disk');

    const ext = extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.sendFile(filePath);
  }
}

// ---------------------------------------------------------------------------
// Admin KYC controller  —  /admin/kyc
// ---------------------------------------------------------------------------
@ApiTags('admin-kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/kyc')
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * GET /admin/kyc
   * Returns all KYC submissions with the associated user's name and email.
   */
  @Get()
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Admin: list all KYC submissions' })
  getAll() {
    return this.kycService.adminGetAll();
  }

  /**
   * GET /admin/kyc/:id
   * Returns a single KYC submission with full details for review.
   */
  @Get(':id')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Admin: get a single KYC submission by ID' })
  getOne(@Param('id') id: string) {
    return this.kycService.adminGetOne(id);
  }

  /**
   * PATCH /admin/kyc/:id/review
   * Approve or reject a KYC submission.
   * Body: { status: 'approved' | 'rejected', rejectionReason?: string }
   */
  @Patch(':id/review')
  @RequirePermission('user_management', 'approve')
  @ApiOperation({ summary: 'Admin: approve or reject a KYC submission' })
  review(
    @Param('id') id: string,
    @CurrentUser() admin: { userId: string },
    @Body() dto: ReviewKycDto,
  ) {
    return this.kycService.adminReview(id, admin.userId, dto);
  }

  /**
   * GET /admin/kyc/:id/document/:docType
   * Streams a KYC document to the admin for viewing/download.
   * docType: 'cert' | 'utility' | 'ownerId'
   *
   * Files are streamed from disk (not exposed as public URLs) to prevent
   * sensitive business documents from leaking.
   */
  @Get(':id/document/:docType')
  @RequirePermission('user_management', 'view')
  @ApiOperation({ summary: 'Admin: download a KYC document by type' })
  async downloadDocument(
    @Param('id') id: string,
    @Param('docType') docType: string,
    @CurrentUser() admin: { userId: string },
    @Res() res: Response,
  ) {
    const filename = await this.kycService.getDocumentPath(
      id,
      docType as 'cert' | 'utility' | 'ownerId',
      admin.userId,
      true, // admin
    );

    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) throw new NotFoundException('Document file not found on disk');

    const ext = extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.sendFile(filePath);
  }
}
