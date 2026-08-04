import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plan to subscribe and pay for',
  })
  @IsUUID()
  planId: string;
}
