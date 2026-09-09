export enum ScheduledNotificationStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const SCHEDULED_NOTIFICATION_STATUS_VALUES = Object.values(ScheduledNotificationStatus);
