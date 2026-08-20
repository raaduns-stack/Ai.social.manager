import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class ApproveVariationDto {
  @ApiProperty({
    description: 'The UUID of the variation to approve (taken from the route param, not the body)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  variationId!: string;

  @ApiProperty({
    description: 'Optional date and time to schedule the post for (if omitted, falls back to the parent post\'s scheduled date)',
    example: '2026-08-30T10:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
