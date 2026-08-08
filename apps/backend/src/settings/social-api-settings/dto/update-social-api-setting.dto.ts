import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSocialApiSettingDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
