import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePromptDto {
  // Optional new prompt name
  @IsOptional()
  @IsString()
  name?: string;

  // Optional category
  @IsOptional()
  @IsString()
  category?: string;

  // Optional prompt text
  @IsOptional()
  @IsString()
  prompt?: string;

  // Optional active status
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}