import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object (DTO) for generating a caption request.
 * Formats API documentation and validates that business type details are strings.
 */
export class GenerateCaptionDto {
  /**
   * The type of business or industry context for caption generation.
   */
  @ApiProperty({
    example: 'Coffee Shop',
  })
  @IsString()
  businessType!: string;
}