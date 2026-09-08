import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateImageToCodeDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  code?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  techNotes?: string;
}
