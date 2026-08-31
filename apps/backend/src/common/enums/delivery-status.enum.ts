export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}

export const DELIVERY_STATUS_VALUES = Object.values(DeliveryStatus);
