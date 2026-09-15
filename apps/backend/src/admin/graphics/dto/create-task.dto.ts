import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsDateString, MaxLength } from 'class-validator';

export class CreateGraphicsTaskDto {
  @ApiProperty({ example: 'Ramadan promo banner set' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Three 1080x1080 banners, brand orange + white.' })
  @IsOptional()
  @IsString()
  brief?: string;

  @ApiPropertyOptional({ enum: ['high', 'medium', 'low'], default: 'medium' })
  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @ApiPropertyOptional({ example: '2026-09-14' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'Designer (users.id) this task is assigned to' })
  @IsUUID()
  designerId: string;
}
