import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum SocialAccountStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ACTION_REQUIRED = 'action_required',
}

export class UpdateSocialAccountDto {
  @IsOptional()
  @IsEnum(SocialAccountStatus)
  status?: SocialAccountStatus;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;
}
