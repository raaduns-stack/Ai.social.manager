export interface SystemUser {
  id: string;
  email: string;
  name: string;
}

export interface AnnouncementRequest {
  title: string;
  message: string;
  targetUserIds?: string[];
  channel: 'EMAIL' | 'IN_APP' | 'BOTH';
  actionUrl?: string;
  senderFirstName?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRecord {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: 'SENT' | 'FAILED';
  error?: string | null;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationProviders {
  getCustomers: (userIds?: string[]) => Promise<SystemUser[]>;
  sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
  sendInApp?: (userId: string, data: Record<string, any>) => Promise<void>;
  saveNotificationLog?: (records: NotificationRecord[]) => Promise<void>;
}

export async function sendSystemAnnouncement(
  request: AnnouncementRequest,
  providers: NotificationProviders
) {
  const { title, message, targetUserIds, channel, actionUrl, senderFirstName, metadata } = request;
  const users = await providers.getCustomers(targetUserIds);
  const notificationRecords: NotificationRecord[] = [];
  const notifType = metadata?.announcementType || 'SYSTEM_ANNOUNCEMENT';

  for (const user of users) {
    let status: 'SENT' | 'FAILED' = 'SENT';
    let error: string | null = null;

    try {
      if ((channel === 'EMAIL' || channel === 'BOTH') && providers.sendEmail) {
        await providers.sendEmail(
          user.email,
          title,
          `<p>Dear ${user.name},</p><p>${message}</p>${senderFirstName ? `<p>Best regards,<br/>${senderFirstName}</p>` : ''}`
        );
      }

      if ((channel === 'IN_APP' || channel === 'BOTH') && providers.sendInApp) {
        await providers.sendInApp(user.id, {
          type: notifType,
          title,
          message,
          timestamp: new Date(),
        });
      }
    } catch (err: any) {
      status = 'FAILED';
      error = err?.message || 'Failed to dispatch notification';
    }

    notificationRecords.push({
      userId: user.id,
      type: notifType,
      title,
      message,
      channel,
      status,
      error,
      actionUrl,
      metadata,
    });
  }

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(notificationRecords);
  }

  return { totalTargeted: users.length, records: notificationRecords };
}