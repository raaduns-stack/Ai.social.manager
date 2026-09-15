import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewSubmissionDto {
  @ApiProperty({
    description: 'Review status decision',
    enum: ['under_review', 'revision_required', 'approved', 'completed'],
    example: 'approved',
  })
  @IsEnum(['under_review', 'revision_required', 'approved', 'completed'])
  @IsNotEmpty()
  status: 'under_review' | 'revision_required' | 'approved' | 'completed';

  @ApiPropertyOptional({
    description: 'Review feedback notes or instructions for revision',
    example: 'Great typography. Approved for production.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
