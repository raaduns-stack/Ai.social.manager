import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional()
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  category?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;
}
