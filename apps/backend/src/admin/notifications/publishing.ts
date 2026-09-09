export interface PublishingNotificationRequest {
  customer: {
    id: string;
    email: string;
    name: string;
  };
  postId: string;
  postTitle: string;
  platform: string;
  isSuccess: boolean;
  publishErrorMessage?: string;
}

export interface PublishingProviders {
  sendEmail?: (to: string, subject: string, body: string) => Promise<void>;
  sendInApp?: (userId: string, data: Record<string, any>) => Promise<void>;
  saveNotificationLog?: (record: Record<string, any>) => Promise<void>;
}

export async function sendPublishingNotification(
  request: PublishingNotificationRequest,
  providers: PublishingProviders
) {
  const { customer, postId, postTitle, platform, isSuccess, publishErrorMessage } = request;

  const title = isSuccess
    ? `Post Published Successfully on ${platform}`
    : `Failed to Publish Post on ${platform}`;

  const message = isSuccess
    ? `Your post "${postTitle}" was successfully published to ${platform}.`
    : `We encountered an issue publishing "${postTitle}" to ${platform}.${
        publishErrorMessage ? ` Reason: ${publishErrorMessage}` : ''
      }`;

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
        type: isSuccess ? 'CONTENT_PUBLISHED' : 'CONTENT_PUBLISH_FAILED',
        title,
        message,
        postId,
        platform,
        isSuccess,
        timestamp: new Date(),
      });
    }
  } catch (err: any) {
    status = 'FAILED';
    error = err?.message || 'Publishing notification dispatch failed';
  }

  const record = {
    userId: customer.id,
    type: isSuccess ? 'CONTENT_PUBLISHED' : 'CONTENT_PUBLISH_FAILED',
    title,
    message,
    channel: 'BOTH',
    status,
    error,
    metadata: { postId, platform, isSuccess, publishErrorMessage },
    createdAt: new Date(),
  };

  if (providers.saveNotificationLog) {
    await providers.saveNotificationLog(record);
  }

  return record;
}