import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskStatusDto {
  @IsString()
  @IsIn(['open', 'in_progress', 'done'])
  @ApiProperty({ enum: ['open', 'in_progress', 'done'] })
  status: string;
}
