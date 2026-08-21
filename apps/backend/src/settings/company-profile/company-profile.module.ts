/**
 * CompanyProfileModule
 * --------------------
 * NestJS feature module that encapsulates everything related to the
 * platform owner's company profile (i.e. the RaaSocial agency's
 * own branding/contact information that appears across the admin panel).
 *
 * Responsibilities:
 *  - Registers CompanyProfileController so the route
 *    /api/admin/settings/company-profile is available.
 *  - Provides CompanyProfileService as a singleton injectable.
 *  - Exports CompanyProfileService so other modules (e.g. SettingsModule)
 *    can inject it without re-declaring it.
 *
 * Note: DatabaseModule is NOT imported here because it is globally provided
 * via the @Global() decorator in DatabaseModule — the DATABASE_CONNECTION
 * token is therefore available to every service without an explicit import.
 */
import { Module } from '@nestjs/common';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';

@Module({
  controllers: [CompanyProfileController],
  providers: [CompanyProfileService],
  exports: [CompanyProfileService], // exported so sibling settings modules can use it if needed
})
export class CompanyProfileModule {}
