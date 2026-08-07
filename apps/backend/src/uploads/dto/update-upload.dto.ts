import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUploadDto } from './create-upload.dto';
import { UploadCategory } from '../../common/enums/upload-category.enum';

export class UpdateUploadDto extends PartialType(CreateUploadDto) {
  @ApiPropertyOptional({
    description: 'Category of the uploaded asset',
    enum: UploadCategory,
    example: UploadCategory.BUSINESS_ASSETS,
  })
  @IsOptional()
  @IsEnum(UploadCategory)
  category?: UploadCategory;
}
