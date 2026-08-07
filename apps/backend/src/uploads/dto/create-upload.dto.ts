import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UploadCategory } from '../../common/enums/upload-category.enum';

export class CreateUploadDto {
  @ApiProperty({
    description: 'Category of the uploaded asset',
    enum: UploadCategory,
    example: UploadCategory.BUSINESS_ASSETS,
  })
  @IsEnum(UploadCategory)
  category: UploadCategory;

  @ApiProperty({
    description: 'Optional description for the upload',
    required: false,
    example: 'A high-resolution office view image',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Allows multipart/form-data file field to pass validation
  @ApiProperty({
    description: 'Uploaded file',
    required: false,
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  file?: any;
}