/**
 * CustomerProfileController
 * -------------------------
 * REST controller for customer-facing company profile management.
 * Base route: /api/profile/company
 *
 * Each authenticated customer can view and edit their own company profile
 * (business name, description, industry, logo, etc.).  Admins do not use
 * this controller — they use CompanyProfileController for the platform's
 * own profile.
 *
 * All routes require:
 *  - A valid JWT access token (JwtAuthGuard)
 *  - No role restriction — any authenticated user is allowed
 *
 * The userId is always taken from the JWT payload via @CurrentUser(),
 * never from the request body, so customers cannot impersonate each other.
 *
 * Endpoints:
 *  GET  /  — Return the current user's company profile (empty shell if none).
 *  PATCH / — Create or update the current user's company profile (upsert).
 */
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerProfileService } from './customer-profile.service';
import { UpdateCustomerCompanyProfileDto } from './dto/update-customer-company-profile.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('profile/company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // only JWT required — no role restriction
@Controller('profile/company')
export class CustomerProfileController {
  constructor(private readonly customerProfileService: CustomerProfileService) {}

  /**
   * GET /api/profile/company
   * Returns the company profile for the currently authenticated customer.
   * If no profile exists yet, returns an empty profile shell (id: null)
   * rather than a 404, so the frontend can pre-fill the form gracefully.
   *
   * @param user - JWT payload containing the authenticated user's ID.
   */
  @Get()
  @ApiOperation({ summary: 'Get the current user company profile' })
  getCompanyProfile(@CurrentUser() user: { userId: string }) {
    return this.customerProfileService.getCompanyProfile(user.userId);
  }

  /**
   * PATCH /api/profile/company
   * Creates the customer's company profile if it doesn't exist yet,
   * or updates it if it does (upsert behaviour).
   *
   * @param user - JWT payload for the authenticated customer (provides userId).
   * @param dto  - Fields to set/update on the company profile.
   */
  @Patch()
  @ApiOperation({ summary: 'Update or create the current user company profile' })
  updateCompanyProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCustomerCompanyProfileDto,
  ) {
    return this.customerProfileService.updateCompanyProfile(user.userId, dto);
  }
}
