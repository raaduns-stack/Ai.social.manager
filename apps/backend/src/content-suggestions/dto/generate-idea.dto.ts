import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object (DTO) for requesting business or content idea generation.
 * Handles payload validation and OpenAPI documentation for the request body.
 */

export class GenerateIdeaDto {
  /**
   * The industry sector or business model used to generate relevant ideas.
   */
  @ApiProperty({
    example: 'Coffee Shop',
  })
  @IsString()
  businessType!: string;
}