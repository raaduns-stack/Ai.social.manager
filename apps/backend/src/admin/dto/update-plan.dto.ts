import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  features?: any;

  @IsNumber()
  @IsOptional()
  monthlyPostLimit?: number;

  @IsNumber()
  @IsOptional()
  maxSocialAccounts?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
