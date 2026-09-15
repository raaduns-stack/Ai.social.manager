import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsDateString, MaxLength } from 'class-validator';

export class UpdateGraphicsTaskDto {
  @ApiPropertyOptional({ example: 'Ramadan promo banner set' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brief?: string;

  @ApiPropertyOptional({ enum: ['high', 'medium', 'low'] })
  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @ApiPropertyOptional({ enum: ['open', 'in_progress', 'done'] })
  @IsOptional()
  @IsIn(['open', 'in_progress', 'done'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-09-14' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Reassign to another designer (users.id)' })
  @IsOptional()
  @IsUUID()
  designerId?: string;
}
