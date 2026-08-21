/**
 * review-kyc.dto.ts
 * ---------------------------------------------------------------------------
 * DTO for admin review actions (approve / reject).
 * Only admin roles may use the endpoint that accepts this DTO.
 * ---------------------------------------------------------------------------
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum KycReviewAction {
  PENDING = 'pending',
  APPROVE = 'approved',
  REJECT = 'rejected',
  RESUBMISSION_REQUIRED = 'resubmission_required',
}

export class ReviewKycDto {
  @ApiProperty({
    enum: KycReviewAction,
    description: 'Decision: "approved" grants access; "rejected" or "resubmission_required" blocks and requires correction',
  })
  @IsEnum(KycReviewAction)
  status: KycReviewAction;

  @ApiPropertyOptional({
    example: 'The certificate of registration document appears to be unreadable. Please resubmit a clearer image.',
    description: 'Optional reason when status is "rejected" or "resubmission_required".',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
