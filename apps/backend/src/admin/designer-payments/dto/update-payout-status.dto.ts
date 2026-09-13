import { IsIn, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePayoutStatusDto {
  @ApiProperty({
    description: 'New payment status',
    enum: ['pending', 'approved', 'processing', 'successful', 'paid', 'failed', 'declined'],
  })
  @IsIn(['pending', 'approved', 'processing', 'successful', 'paid', 'failed', 'declined'])
  status: 'pending' | 'approved' | 'processing' | 'successful' | 'paid' | 'failed' | 'declined';

  @ApiPropertyOptional({ description: 'Admin note or reason' })
  @IsString()
  @IsOptional()
  notes?: string;
}
