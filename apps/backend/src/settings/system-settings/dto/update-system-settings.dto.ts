import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  defaultTimezone?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNewRegistrations?: boolean;

  @IsOptional()
  @IsBoolean()
  contentApprovalRequired?: boolean;

  @IsOptional()
  @IsString()
  dateFormat?: string;
}
