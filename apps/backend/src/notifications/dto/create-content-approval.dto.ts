import { IsString, IsNotEmpty, IsOptional, IsIn, IsUrl } from 'class-validator';
import { NotificationChannel, NOTIFICATION_CHANNEL_VALUES } from '../../common/enums';

export class CreateContentApprovalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  calendarPostId: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  contentLink?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel: NotificationChannel;
}
