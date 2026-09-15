import { IsUUID, IsInt, Min, IsIn, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayoutDto {
  @ApiProperty({ description: 'Target designer ID' })
  @IsUUID()
  designerId: string;

  @ApiProperty({ description: 'Gross payout amount in kobo', example: 1500000 })
  @IsInt()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Payout type: manual or global', enum: ['manual', 'global'], default: 'manual' })
  @IsIn(['manual', 'global'])
  payoutType: 'manual' | 'global';

  @ApiPropertyOptional({ description: 'Payout period string', example: 'Sep 1 - Sep 15, 2026' })
  @IsString()
  @IsOptional()
  period?: string;

  @ApiPropertyOptional({ description: 'Related design work description', example: '3 approved graphics, 1 image-to-code' })
  @IsString()
  @IsOptional()
  relatedWork?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Account name' })
  @IsString()
  @IsOptional()
  accountName?: string;
}
