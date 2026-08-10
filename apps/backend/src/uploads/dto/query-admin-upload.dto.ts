import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QueryUploadDto } from './query-upload.dto';
import { UploadStatus } from '../../common/enums/upload-status.enum';

export class QueryAdminUploadDto extends QueryUploadDto {
  @ApiPropertyOptional({
    description: 'Filter uploads by review status',
    enum: UploadStatus,
  })
  @IsOptional()
  @IsEnum(UploadStatus)
  status?: UploadStatus;

  @ApiPropertyOptional({
    description: 'Filter uploads by the customer (user) ID who submitted them',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}