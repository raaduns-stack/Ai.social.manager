/**
 * CustomerProfileModule
 * ---------------------
 * NestJS feature module that encapsulates each customer's own company
 * profile (business name, contact info, logo, etc.).
 *
 * Unlike CompanyProfileModule (which stores the platform owner's profile),
 * this module is customer-facing — every authenticated customer can view
 * and update their own company information through /api/profile/company.
 *
 * Responsibilities:
 *  - Registers CustomerProfileController for the /api/profile/company routes.
 *  - Provides CustomerProfileService as a singleton injectable.
 *  - Exports CustomerProfileService for use in other modules.
 *
 * Access control:
 *  - Protected by JwtAuthGuard only (no RolesGuard) — any verified customer
 *    can manage their own profile; there is no admin-only restriction.
 */
import { Module } from '@nestjs/common';
import { CustomerProfileController } from './customer-profile.controller';
import { CustomerProfileService } from './customer-profile.service';

@Module({
  controllers: [CustomerProfileController],
  providers: [CustomerProfileService],
  exports: [CustomerProfileService],
})
export class CustomerProfileModule {}
