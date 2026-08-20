import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ApproveVariationDto {
  @ApiProperty({
    description: 'Optional date and time to schedule the post for (if omitted, falls back to the parent post\'s scheduled date)',
    example: '2026-08-30T10:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
