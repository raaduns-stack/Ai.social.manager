import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Brief or specifications' })
  @IsString()
  @IsOptional()
  brief?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['low', 'medium', 'high'] })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Status', enum: ['open', 'in_progress', 'done'] })
  @IsEnum(['open', 'in_progress', 'done'])
  @IsOptional()
  status?: 'open' | 'in_progress' | 'done';

  @ApiPropertyOptional({ description: 'Due date timestamp' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Assigned designer user ID' })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
