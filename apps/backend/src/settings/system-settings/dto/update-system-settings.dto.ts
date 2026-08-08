import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  defaultTimezone?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNewRegistrations?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeTrialDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSocialAccountsPerCustomer?: number;

  @IsOptional()
  @IsBoolean()
  contentApprovalRequired?: boolean;

  @IsOptional()
  @IsString()
  dateFormat?: string;
}
