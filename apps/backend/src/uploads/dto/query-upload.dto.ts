import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UploadCategory } from '../../common/enums/upload-category.enum';

export class QueryUploadDto {
  @ApiPropertyOptional({
    description: 'Filter uploads by category',
    enum: UploadCategory,
  })
  @IsOptional()
  @IsEnum(UploadCategory)
  category?: UploadCategory;

  @ApiPropertyOptional({
    description: 'Limit the number of results returned',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Filter uploads by filename search query',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort option',
    example: 'Newest',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
