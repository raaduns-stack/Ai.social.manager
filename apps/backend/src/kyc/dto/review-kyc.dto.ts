/**
 * review-kyc.dto.ts
 * ---------------------------------------------------------------------------
 * DTO for admin review actions (approve / reject).
 * Only admin roles may use the endpoint that accepts this DTO.
 * ---------------------------------------------------------------------------
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export enum KycReviewAction {
  APPROVE = 'approved',
  REJECT = 'rejected',
}

export class ReviewKycDto {
  @ApiProperty({
    enum: KycReviewAction,
    description: 'Decision: "approved" grants social-account access; "rejected" blocks and requires resubmission',
  })
  @IsEnum(KycReviewAction)
  status: KycReviewAction;

  @ApiPropertyOptional({
    example: 'The certificate of registration document appears to be unreadable. Please resubmit a clearer image.',
    description: 'Required when status is "rejected". Explains to the user what needs to be corrected.',
  })
  // rejectionReason is required only when rejecting
  @ValidateIf((o) => o.status === KycReviewAction.REJECT)
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rejectionReason?: string;
}
