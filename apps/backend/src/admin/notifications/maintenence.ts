export interface MaintenanceNotificationRequest {
  startTime: Date;
  endTime: Date;
  description: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetAudience?: 'all' | 'selected';
  targetUserIds?: string[];
}

export interface MaintenanceProviders {
  getCustomers: (userIds?: string[]) => Promise<Array<{ id: string; email: string; name: string }>>;
  getAllCustomers: () => Promise<Array<{ id: string; email: string; name: string }>>;
  sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
  sendInApp?: (userId: string, data: Record<string, any>) => Promise<void>;
  saveNotificationLog?: (records: Array<Record<string, any>>) => Promise<void>;
}

export async function sendMaintenanceNotification(
  request: MaintenanceNotificationRequest,
  providers: MaintenanceProviders
) {
  const { startTime, endTime, description, priority, targetAudience, targetUserIds } = request;

  const customers = targetAudience === 'selected' && targetUserIds && targetUserIds.length > 0
    ? await providers.getCustomers(targetUserIds)
    : await providers.getAllCustomers();

  const title = 'Scheduled System Maintenance Notice';
  const message = `Please be advised that system maintenance is scheduled from ${startTime.toUTCString()} to ${endTime.toUTCString()}. ${description}`;

  const notificationRecords: Array<Record<string, any>> = [];

  for (const customer of customers) {
    let status: 'SENT' | 'FAILED' = 'SENT';
    let error: string | null = null;

    try {
      if (providers.sendEmail) {
        await providers.sendEmail(
          customer.email,
          title,
          `<p>Hi ${customer.name},</p><p>${message}</p>`
        );
      }

      if (providers.sendInApp) {
        await providers.sendInApp(customer.id, {
          type: 'MAINTENANCE',
          title,
          message,
          startTime,
          endTime,
          priority,
          timestamp: new Date(),
        });
      }
    } catch (err: any) {
      status = 'FAILED';
      error = err?.message || 'Maintenance notification dispatch failed';
    }

    notificationRecords.push({
      userId: customer.id,
      type: 'MAINTENANCE',
      title,
      message,
      channel: 'BOTH',
      status,
      error,
      priority: priority || 'NORMAL',
      metadata: { startTime: startTime.toISOString(), endTime: endTime.toISOString() },
      createdAt: new Date(),
    });
  }

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(notificationRecords);
  }

  return { notifiedUsersCount: customers.length, records: notificationRecords };
}