import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateIdeaDto {
  @ApiProperty({
    example: 'Coffee Shop',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  postId?: string;
}