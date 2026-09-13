import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DesignReportsQueryDto {
  @ApiPropertyOptional({
    description: 'Timeframe preset',
    enum: ['all', 'today', '7d', '30d', 'this_month', 'last_month', 'this_year'],
    default: '30d',
  })
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Custom start date (ISO string / YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Custom end date (ISO string / YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by specific designer UUID' })
  @IsOptional()
  @IsString()
  designerId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific staff member UUID' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ description: 'Filter by design category' })
  @IsOptional()
  @IsString()
  category?: string;
}
