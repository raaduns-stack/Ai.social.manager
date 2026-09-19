import { IsInt, Min, IsIn, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignerPayoutRequestDto {
  @ApiProperty({ description: 'Gross payout amount requested in kobo', example: 500000 })
  @IsInt()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({
    description: 'Payout type: manual (early) or global (scheduled cycle)',
    enum: ['manual', 'global'],
    default: 'manual',
  })
  @IsIn(['manual', 'global'])
  @IsOptional()
  payoutType?: 'manual' | 'global';

  @ApiPropertyOptional({ description: 'Optional designer notes for the payout request' })
  @IsString()
  @IsOptional()
  notes?: string;
}
