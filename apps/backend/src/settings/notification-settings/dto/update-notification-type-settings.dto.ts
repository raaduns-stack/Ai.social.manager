import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationTypeSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabledGlobally?: boolean;
}
