import { IsNotEmpty, IsString, IsISO8601, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduledPostDto {
  @ApiProperty({
    description: 'The unique variation ID acting as idempotency key',
    example: '22222222-2222-2222-2222-222222222222',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  variationId: string;

  @ApiProperty({
    description: 'The customer (user) ID who owns the post',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'The target social platform (e.g. facebook, instagram, x, linkedin)',
    example: 'x',
  })
  @IsNotEmpty()
  @IsString()
  platform: string;

  @ApiProperty({
    description: 'The text content of the post',
    example: 'Hello, this is a scheduled post!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'The scheduled time in ISO 8601 format',
    example: '2026-08-18T16:00:00.000Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  scheduledFor: string;
}
