import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoginStatus } from '../../common/enums/login-status.enum';

export class QueryLoginHistoryDto {
  @ApiPropertyOptional({
    description: 'Filter by login status',
    enum: LoginStatus,
  })
  @IsOptional()
  @IsEnum(LoginStatus)
  status?: LoginStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search by email address (partial match)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter records on or after this ISO date (e.g. 2024-01-01)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter records on or before this ISO date (e.g. 2024-12-31)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by exact IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
