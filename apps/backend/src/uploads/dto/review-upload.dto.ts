import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { UploadStatus } from '../../common/enums/upload-status.enum';

export class ReviewUploadDto {
    @ApiProperty({
        description: 'New review status to apply to this upload',
        enum: [UploadStatus.APPROVED, UploadStatus.REJECTED],
        example: UploadStatus.APPROVED,
    })
    @IsEnum([UploadStatus.APPROVED, UploadStatus.REJECTED], {
        message: 'Status must be approved or rejected',
    })
    status: UploadStatus.APPROVED | UploadStatus.REJECTED;

    @ApiProperty({
        description: 'Reason for rejection. Required when status is "rejected".',
        required: false,
        example: 'Image resolution is too low to use in published content',
    })
    // Only required/validated when the admin is rejecting the upload
    @ValidateIf((dto) => dto.status === UploadStatus.REJECTED)
    @IsString({ message: 'A rejection reason is required when rejecting an upload' })
    rejectionReason?: string;
}