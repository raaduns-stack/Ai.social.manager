export interface SubscriptionReminderRequest {
  user: {
    id: string;
    email: string;
    name: string;
  };
  daysToExpiry: number;
  expiryDate: Date;
}

export interface SubscriptionReminderProviders {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  saveNotificationLog?: (record: Record<string, any>) => Promise<void>;
}

export async function sendSubscriptionReminder(
  request: SubscriptionReminderRequest,
  providers: SubscriptionReminderProviders
) {
  const { user, daysToExpiry, expiryDate } = request;
  const isExpired = daysToExpiry < 0;
  const absDays = Math.abs(daysToExpiry);

  const title = isExpired
    ? `Action Required: Your subscription expired ${absDays} day(s) ago`
    : `Reminder: Your subscription expires in ${absDays} day(s)`;

  const message = isExpired
    ? `Your AI Social Media Manager subscription expired on ${expiryDate.toDateString()}. Please renew your subscription to avoid service interruption.`
    : `Your AI Social Media Manager subscription will expire on ${expiryDate.toDateString()}. Renew now to ensure uninterrupted service.`;

  let status: 'SENT' | 'FAILED' = 'SENT';
  let error: string | null = null;

  try {
    await providers.sendEmail(
      user.email,
      title,
      `<p>Hi ${user.name},</p><p>${message}</p>`
    );
  } catch (err: any) {
    status = 'FAILED';
    error = err?.message || 'Failed to dispatch subscription reminder email';
  }

  const notificationRecord = {
    userId: user.id,
    type: 'SUBSCRIPTION_RENEWAL_REMINDER',
    title,
    message,
    channel: 'EMAIL',
    status,
    error,
    metadata: { daysToExpiry, expiryDate: expiryDate.toISOString() },
    createdAt: new Date(),
  };

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(notificationRecord);
  }

  return notificationRecord;
}