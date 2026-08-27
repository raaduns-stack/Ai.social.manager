export interface ContentApprovalRequest {
  customer: {
    id: string;
    email: string;
    name: string;
  };
  contentId: string;
  contentTitle: string;
  reviewUrl: string;
}

export interface ContentApprovalProviders {
  sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
  sendInApp?: (userId: string, data: Record<string, any>) => Promise<void>;
  saveNotificationLog?: (record: Record<string, any>) => Promise<void>;
}

export async function sendContentApprovalNotification(
  request: ContentApprovalRequest,
  providers: ContentApprovalProviders
) {
  const { customer, contentId, contentTitle, reviewUrl } = request;
  const title = 'New Content Ready for Review';
  const message = `Your post "${contentTitle}" is ready for approval. Please review it before the scheduled release.`;

  let status: 'SENT' | 'FAILED' = 'SENT';
  let error: string | null = null;

  try {
    if (providers.sendEmail) {
      await providers.sendEmail(
        customer.email,
        title,
        `<p>Hi ${customer.name},</p><p>${message}</p><p><a href="${reviewUrl}">Click here to review and approve</a></p>`
      );
    }

    if (providers.sendInApp) {
      await providers.sendInApp(customer.id, {
        type: 'APPROVAL',
        title,
        message,
        contentId,
        reviewUrl,
        timestamp: new Date(),
      });
    }
  } catch (err: any) {
    status = 'FAILED';
    error = err?.message || 'Content approval notification failed';
  }

  const record = {
    userId: customer.id,
    type: 'APPROVAL',
    title,
    message,
    channel: 'BOTH',
    status,
    error,
    metadata: { contentId, reviewUrl },
    createdAt: new Date(),
  };

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(record);
  }

  return record;
}