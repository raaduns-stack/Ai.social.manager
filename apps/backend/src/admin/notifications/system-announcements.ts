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
}

export interface NotificationRecord {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: 'SENT' | 'FAILED';
  error?: string | null;
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
  const { title, message, targetUserIds, channel } = request;
  const users = await providers.getCustomers(targetUserIds);
  const notificationRecords: NotificationRecord[] = [];

  for (const user of users) {
    let status: 'SENT' | 'FAILED' = 'SENT';
    let error: string | null = null;

    try {
      if ((channel === 'EMAIL' || channel === 'BOTH') && providers.sendEmail) {
        await providers.sendEmail(
          user.email,
          `[System Announcement] ${title}`,
          `<p>Dear ${user.name},</p><p>${message}</p>`
        );
      }

      if ((channel === 'IN_APP' || channel === 'BOTH') && providers.sendInApp) {
        await providers.sendInApp(user.id, {
          type: 'ANNOUNCEMENT',
          title,
          message,
          timestamp: new Date(),
        });
      }
    } catch (err: any) {
      status = 'FAILED';
      error = err?.message || 'Failed to dispatch system announcement';
    }

    notificationRecords.push({
      userId: user.id,
      type: 'ANNOUNCEMENT',
      title,
      message,
      channel,
      status,
      error,
    });
  }

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(notificationRecords);
  }

  return { totalTargeted: users.length, records: notificationRecords };
}