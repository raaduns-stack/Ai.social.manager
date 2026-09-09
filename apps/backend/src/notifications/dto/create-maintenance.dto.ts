import { IsString, IsNotEmpty, IsDateString, IsOptional, IsInt, Min, IsIn, IsArray, IsUUID } from 'class-validator';
import { NotificationPriority, NOTIFICATION_PRIORITY_VALUES } from '../../common/enums';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedDurationMinutes?: number;

  @IsOptional()
  @IsIn(NOTIFICATION_PRIORITY_VALUES)
  priority?: NotificationPriority;

  @IsOptional()
  @IsIn(['all', 'selected'])
  targetAudience?: 'all' | 'selected';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  targetUserIds?: string[];
}
