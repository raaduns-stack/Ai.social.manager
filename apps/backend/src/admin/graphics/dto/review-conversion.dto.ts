import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

export class ReviewGraphicsConversionDto {
  @ApiProperty({
    description: 'New review status to apply to this conversion',
    enum: ['accepted', 'revision_required'],
    example: 'accepted',
  })
  @IsIn(['accepted', 'revision_required'])
  status: 'accepted' | 'revision_required';

  @ApiPropertyOptional({
    description: 'Reviewer note. Required when requesting a revision.',
    example: 'Menu grid is missing the drinks section',
  })
  @ValidateIf((dto) => dto.status === 'revision_required')
  @IsString({ message: 'A reviewer note is required when requesting a revision' })
  @MaxLength(2000)
  note?: string;
}
