import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { NotificationChannel, NOTIFICATION_CHANNEL_VALUES } from '../../common/enums';

export class CreateContentPublishedDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(['PUBLISHED', 'FAILED'])
  status: 'PUBLISHED' | 'FAILED';

  @IsString()
  @IsNotEmpty()
  scheduledPostId: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel: NotificationChannel;
}
