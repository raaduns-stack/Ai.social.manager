import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, IsUrl, IsUUID } from 'class-validator';
import { NotificationChannel, NotificationPriority, NOTIFICATION_CHANNEL_VALUES, NOTIFICATION_PRIORITY_VALUES } from '../../common/enums';

export class CreateSystemAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  targetUserIds?: string[];

  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel: NotificationChannel;

  @IsOptional()
  @IsIn(NOTIFICATION_PRIORITY_VALUES)
  priority?: NotificationPriority;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
