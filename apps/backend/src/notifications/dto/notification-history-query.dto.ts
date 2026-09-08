import { IsOptional, IsString, IsIn, IsDateString, IsInt, IsBooleanString, Min, Max } from 'class-validator';
import { NotificationType, NotificationChannel, DeliveryStatus, NotificationPriority, NOTIFICATION_TYPE_VALUES, NOTIFICATION_CHANNEL_VALUES, DELIVERY_STATUS_VALUES, NOTIFICATION_PRIORITY_VALUES } from '../../common/enums';

export class NotificationHistoryQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_TYPE_VALUES)
  type?: NotificationType;

  @IsOptional()
  @IsIn(DELIVERY_STATUS_VALUES)
  status?: DeliveryStatus;

  @IsOptional()
  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channel?: NotificationChannel;

  @IsOptional()
  @IsIn(NOTIFICATION_PRIORITY_VALUES)
  priority?: NotificationPriority;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBooleanString()
  isRead?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'readAt', 'sentAt'])
  sortBy?: 'createdAt' | 'readAt' | 'sentAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
