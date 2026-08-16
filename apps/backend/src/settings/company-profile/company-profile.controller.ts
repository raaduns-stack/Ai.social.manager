/**
 * CompanyProfileController
 * ------------------------
 * REST controller for the platform owner's company profile.
 * Base route: /api/admin/settings/company-profile
 *
 * All routes require:
 *  - A valid JWT access token (JwtAuthGuard)
 *  - Admin-level role (RolesGuard)
 *
 * Endpoints:
 *  GET  /  — Fetch the single company profile record.
 *            Accessible by SUPER_ADMIN and ACCOUNT_MANAGER.
 *  PATCH / — Update the company profile fields (name, logo, contact, etc.).
 *            Restricted to SUPER_ADMIN only.
 */
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';

@ApiTags('settings/company-profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/settings/company-profile')
export class CompanyProfileController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  /**
   * GET /api/admin/settings/company-profile
   * Returns the single company profile record from the database.
   * Throws 404 if no profile has been seeded yet.
   * Accessible to: SUPER_ADMIN only (via settings:full check)
   */
  @Get()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Get the company profile' })
  getCompanyProfile() {
    return this.companyProfileService.getCompanyProfile();
  }

  /**
   * PATCH /api/admin/settings/company-profile
   * Partially updates the company profile with the fields provided in the body.
   * Only changed fields need to be included — existing fields are preserved.
   * Restricted to: SUPER_ADMIN only (via settings:full check)
   */
  @Patch()
  @RequirePermission('settings', 'full')
  @ApiOperation({ summary: 'Update the company profile' })
  updateCompanyProfile(@Body() dto: UpdateCompanyProfileDto) {
    return this.companyProfileService.updateCompanyProfile(dto);
  }
}

