import { IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  tasks?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  submissions?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  revisions?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  payments?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  email?: boolean;

  @IsOptional()
  @IsIn(['instant', 'daily', 'weekly'])
  @ApiPropertyOptional({ enum: ['instant', 'daily', 'weekly'] })
  digest?: string;
}
