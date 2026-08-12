import { Module } from '@nestjs/common';
import { SocialAccountsController } from './social-accounts.controller';
import { SocialAccountsService } from './social-accounts.service';
import { KycModule } from '../kyc/kyc.module';

@Module({
  // KycModule is imported so its exported KycService can be injected into
  // SocialAccountsService for the channel-connection KYC gate.
  imports: [KycModule],
  controllers: [SocialAccountsController],
  providers: [SocialAccountsService],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule { }
