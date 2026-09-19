import { IsInt, IsIn, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDesignerPaymentSettingsDto {
  @ApiProperty({ description: 'Amount paid per approved image uploaded in kobo', example: 500000 })
  @IsInt()
  @Min(0)
  perImageAmount: number;

  @ApiProperty({ description: 'Amount paid per accepted image-to-code in kobo', example: 1000000 })
  @IsInt()
  @Min(0)
  perImageToCodeAmount: number;

  @ApiProperty({
    description: 'Global payout schedule frequency',
    example: 'weekly',
    enum: ['weekly', 'monthly'],
  })
  @IsIn(['weekly', 'monthly'])
  payoutSchedule: 'weekly' | 'monthly';

  @ApiProperty({
    description: 'Day of week for weekly payouts (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun)',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  payoutDayOfWeek: number;

  @ApiProperty({ description: 'Day of month for monthly payouts (1-28)', example: 28 })
  @IsInt()
  @Min(1)
  @Max(28)
  payoutDayOfMonth: number;

  @ApiPropertyOptional({ description: 'Charge percentage for early manual payouts', example: 2 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  manualPayoutFeePercent?: number;
}
