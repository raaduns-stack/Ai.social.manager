import { IsString, IsNotEmpty, IsDateString, IsOptional, IsIn } from 'class-validator';
import { NotificationType, NotificationChannel, NOTIFICATION_TYPE_VALUES, NOTIFICATION_CHANNEL_VALUES } from '../../common/enums';

export class CreateScheduledNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(NOTIFICATION_TYPE_VALUES)
  type: NotificationType;

  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel: NotificationChannel;

  @IsDateString()
  scheduledFor: string;

  @IsOptional()
  @IsIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  repeatInterval?: string;

  @IsOptional()
  @IsDateString()
  repeatUntil?: string;
}
