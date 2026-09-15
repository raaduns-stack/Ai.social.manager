import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';

const REVIEW_STATUSES = [
  'received',
  'under_review',
  'revision_required',
  'approved',
  'completed',
] as const;

export class ReviewGraphicsSubmissionDto {
  @ApiProperty({
    description: 'New review status to apply to this submission',
    enum: REVIEW_STATUSES,
    example: 'approved',
  })
  @IsIn([...REVIEW_STATUSES])
  status: (typeof REVIEW_STATUSES)[number];

  @ApiPropertyOptional({
    description: 'Reviewer note. Required when requesting a revision.',
    example: 'Bump contrast on slide 3 text zones',
  })
  @ValidateIf((dto) => dto.status === 'revision_required')
  @IsString({ message: 'A reviewer note is required when requesting a revision' })
  @MaxLength(2000)
  note?: string;
}
