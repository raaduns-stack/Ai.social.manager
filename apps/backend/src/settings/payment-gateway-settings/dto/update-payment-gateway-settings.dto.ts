import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentGatewaySettingsDto {
  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['card', 'bank_transfer', 'ussd', 'mobile_money'], { each: true })
  supportedMethods?: string[];

  @IsOptional()
  @IsBoolean()
  isLiveMode?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
