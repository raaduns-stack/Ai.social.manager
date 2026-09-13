import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Social Media Banner Campaign' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Brief or specifications', example: 'Design 3 variations in 1080x1080' })
  @IsString()
  @IsOptional()
  brief?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['low', 'medium', 'high'], default: 'medium' })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'Due date timestamp', example: '2026-10-01T12:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'User ID of assigned graphic designer', example: 'd3b07384-d113-4676-96b6-96b6170d1000' })
  @IsUUID()
  @IsNotEmpty()
  assignedTo: string;
}
