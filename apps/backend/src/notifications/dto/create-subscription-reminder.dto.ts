import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { NotificationChannel, NOTIFICATION_CHANNEL_VALUES } from '../../common/enums';

export class CreateSubscriptionReminderDto {
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
  subscriptionId: string;

  @IsOptional()
  @IsIn(['before', 'after'])
  reminderKind?: 'before' | 'after';

  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel: NotificationChannel;
}
