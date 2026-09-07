import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc, sql, gt, lt, gte, lte, like, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { MailerService } from '../mailer/mailer.service';
import { UserRole } from '../common/enums/roles.enum';
import sanitizeHtml from 'sanitize-html';

// Import the existing admin notification pure functions
import { sendSystemAnnouncement, AnnouncementRequest } from '../admin/notifications/system-announcements';
import { sendMaintenanceNotification, MaintenanceNotificationRequest } from '../admin/notifications/maintenence';
import { sendContentApprovalNotification, ContentApprovalRequest } from '../admin/notifications/content-approval';
import { sendPublishingNotification, PublishingNotificationRequest } from '../admin/notifications/publishing';
import { sendSubscriptionReminder, SubscriptionReminderRequest } from '../admin/notifications/subscription-reminder';
import { HistoryQueryFilters } from '../admin/notifications/history';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly mailerService: MailerService,
  ) {}

  private sanitizeHtml(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
        'code', 'pre', 'hr', 'sub', 'sup',
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        span: ['style'],
        div: ['style'],
        p: ['style'],
        h1: ['style'],
        h2: ['style'],
        h3: ['style'],
        h4: ['style'],
        h5: ['style'],
        h6: ['style'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: {
        a: ['href', 'xlink:href'],
      },
      transformTags: {
        'a': (tagName: string, attribs: { [key: string]: string }) => {
          if (attribs.href && !attribs.rel) {
            attribs.rel = 'noopener noreferrer';
            attribs.target = '_blank';
          }
          return { tagName, attribs };
        },
      },
    } as any);
  }

  // ---------------------------------------------------------------------------
  // Core Data Access
  // ---------------------------------------------------------------------------

  async createNotification(data: {
    userId: string;
    senderId?: string;
    type: string;
    channel: string;
    status?: string;
    priority?: string;
    title: string;
    message: string;
    error?: string;
    readAt?: Date;
    sentAt?: Date;
    scheduledFor?: Date;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string | null;
    metadata?: Record<string, any>;
  }) {
    const sanitizedMessage = this.sanitizeHtml(data.message);
    const [record] = await this.db.insert(schema.notifications).values({
      userId: data.userId,
      senderId: data.senderId,
      type: data.type as any,
      channel: data.channel as any,
      status: (data.status || 'SENT') as any,
      priority: (data.priority || 'NORMAL') as any,
      title: data.title,
      message: sanitizedMessage,
      error: data.error,
      readAt: data.readAt,
      sentAt: data.sentAt || new Date(),
      scheduledFor: data.scheduledFor,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
    }).returning();
    return record;
  }

  async createBulkNotifications(records: Array<{
    userId: string;
    senderId?: string;
    type: string;
    channel: string;
    status?: string;
    priority?: string;
    title: string;
    message: string;
    error?: string;
    scheduledFor?: Date;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }>) {
    if (records.length === 0) return [];

    const values = records.map((r) => ({
      userId: r.userId,
      senderId: r.senderId,
      type: r.type as any,
      channel: r.channel as any,
      status: (r.status || 'SENT') as any,
      priority: (r.priority || 'NORMAL') as any,
      title: r.title,
      message: this.sanitizeHtml(r.message),
      error: r.error,
      sentAt: new Date(),
      scheduledFor: r.scheduledFor,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      actionUrl: r.actionUrl,
      metadata: r.metadata,
    }));

    return this.db.insert(schema.notifications).values(values).returning();
  }

  public async findExistingNotification(userId: string, type: string, relatedEntityType?: string, relatedEntityId?: string) {
    if (!relatedEntityType || !relatedEntityId) return null;

    return this.db.query.notifications.findFirst({
      where: and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.type, type as any),
        eq(schema.notifications.relatedEntityType, relatedEntityType),
        eq(schema.notifications.relatedEntityId, relatedEntityId),
      ),
    });
  }

  async getNotificationById(userId: string, notificationId: string) {
    const record = await this.db.query.notifications.findFirst({
      where: and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId),
      ),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        sender: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });
    return record || null;
  }

  async getCustomerNotifications(userId: string, options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) {
    const conditions = [eq(schema.notifications.userId, userId)];
    if (options.unreadOnly) {
      conditions.push(eq(schema.notifications.isRead, false));
    }

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const records = await this.db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.notifications.createdAt)],
      limit,
      offset,
      with: {
        sender: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });
    return records;
  }

  async getUnreadCount(userId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false),
      ));

    return Number(result[0]?.count || 0);
  }

  async validateCustomerUserIds(userIds: string[]) {
    const users = await this.db.query.users.findMany({
      where: inArray(schema.users.id, userIds),
      columns: { id: true, role: true },
    });

    const validCustomerIds = new Set(
      users.filter((u) => u.role === UserRole.USER).map((u) => u.id),
    );

    const invalid = userIds.filter((id) => !validCustomerIds.has(id));

    return { valid: Array.from(validCustomerIds), invalid };
  }

  async markAsRead(userId: string, notificationId: string) {
    const [updated] = await this.db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId),
        ),
      )
      .returning();

    return updated;
  }

  async markAllAsRead(userId: string) {
    return this.db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false),
        ),
      )
      .returning();
  }

  async deleteNotification(userId: string, notificationId: string) {
    const [deleted] = await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, userId),
        ),
      )
      .returning({ id: schema.notifications.id });

    return deleted || null;
  }

  // ---------------------------------------------------------------------------
  // Provider Helpers
  // ---------------------------------------------------------------------------

  private async checkUserPreference(userId: string, type: string, channel: 'email' | 'inApp'): Promise<boolean> {
    try {
      const globalSetting = await this.db.query.notificationTypeSettings.findFirst({
        where: eq(schema.notificationTypeSettings.notificationType, type),
      });

      if (globalSetting && !globalSetting.isEnabledGlobally) {
        return false;
      }

      if (globalSetting) {
        if (channel === 'email' && !globalSetting.emailAvailable) return false;
        if (channel === 'inApp' && !globalSetting.inAppAvailable) return false;
      }

      const pref = await this.db.query.notificationPreferences.findFirst({
        where: and(
          eq(schema.notificationPreferences.userId, userId),
          eq(schema.notificationPreferences.notificationType, type),
        ),
      });

      if (pref) {
        if (channel === 'email') return pref.emailEnabled;
        if (channel === 'inApp') return pref.inAppEnabled;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking notification preferences for user ${userId}:`, error);
      return true;
    }
  }

  private getProvidersForType(notificationType: string, senderId?: string) {
    return {
      getCustomers: async (userIds?: string[]) => {
        const queryBuilder = {
          where: userIds && userIds.length > 0
            ? inArray(schema.users.id, userIds)
            : eq(schema.users.role, UserRole.USER),
        };
        const list = await this.db.query.users.findMany(queryBuilder);
        return list.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.fullName,
        }));
      },

      getAllCustomers: async () => {
        const list = await this.db.query.users.findMany({
          where: eq(schema.users.role, UserRole.USER),
        });
        return list.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.fullName,
        }));
      },

      sendEmail: async (to: string, subject: string, body: string) => {
        const user = await this.db.query.users.findFirst({
          where: eq(schema.users.email, to),
        });

        if (user) {
          const isEnabled = await this.checkUserPreference(user.id, notificationType, 'email');
          if (!isEnabled) {
            this.logger.log(`Skipping email notification to ${to} (User unsubscribed from ${notificationType})`);
            return;
          }
        }

        await this.mailerService.sendMail(to, subject, body);
      },

      sendInApp: async (userId: string, data: Record<string, any>) => {
        const isEnabled = await this.checkUserPreference(userId, notificationType, 'inApp');
        if (!isEnabled) {
          this.logger.log(`Skipping in-app notification to user ${userId} (User disabled ${notificationType})`);
          return;
        }

        await this.db.insert(schema.notifications).values({
          userId,
          senderId,
          type: (data.type || notificationType.toUpperCase()) as any,
          title: data.title,
          message: data.message,
          channel: 'IN_APP' as any,
          status: 'SENT' as any,
          isRead: false,
          priority: (data.priority || 'NORMAL') as any,
          metadata: data,
        });
      },

      saveNotificationLog: async (recordOrRecords: any) => {
        const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
        if (records.length === 0) return;

        const dbRecords = records.map((r) => ({
          userId: r.userId,
          senderId,
          type: r.type,
          title: r.title,
          message: r.message,
          channel: r.channel,
          status: r.status,
          error: r.error,
          priority: r.priority || 'NORMAL',
          scheduledFor: r.scheduledFor,
          relatedEntityType: r.relatedEntityType,
          relatedEntityId: r.relatedEntityId,
          actionUrl: r.actionUrl,
          metadata: r.metadata,
        }));

        await this.db.insert(schema.notifications).values(dbRecords as any);
      },
    };
  }

  /**
   * Persist a notification into every active staff/admin user's own feed so
   * the admin navbar bell surfaces it. Customers are intentionally excluded.
   */
  async broadcastToStaffRole(payload: {
    type: string;
    title: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    actionUrl?: string;
    metadata?: Record<string, any>;
    senderId?: string;
  }) {
    const admins = await this.db.query.users.findMany({
      where: inArray(schema.users.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ACCOUNT_MANAGER,
        UserRole.REVIEWER,
        UserRole.SUPPORT_STAFF,
        UserRole.DESIGNER,
      ]),
    });

    if (admins.length === 0) {
      return { totalTargeted: 0, records: [] };
    }

    const records = await this.createBulkNotifications(
      admins.map((admin) => ({
        userId: admin.id,
        type: payload.type,
        channel: 'IN_APP',
        status: 'SENT',
        priority: payload.priority || 'NORMAL',
        title: payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl,
        senderId: payload.senderId,
        metadata: payload.metadata,
      }))
    );

    return { totalTargeted: admins.length, records };
  }

  // ---------------------------------------------------------------------------
  // Admin Operations
  // ---------------------------------------------------------------------------

  async dispatchSystemAnnouncement(request: AnnouncementRequest, senderId?: string) {
    const providers = this.getProvidersForType('announcement', senderId);
    const result = await sendSystemAnnouncement(request, providers);
    if (senderId && result.records) {
      await this.createBulkNotifications(
        result.records.map((r) => ({ ...r, senderId, error: r.error ?? undefined })),
      );
    }
    return result;
  }

  async dispatchMaintenance(request: MaintenanceNotificationRequest, senderId?: string) {
    const providers = this.getProvidersForType('maintenance', senderId);
    const result = await sendMaintenanceNotification(request, providers);
    if (senderId && result.records) {
      await this.createBulkNotifications(
        result.records.map((r) => ({ ...(r as any), senderId, error: r.error ?? undefined })),
      );
    }
    return result;
  }

  async dispatchContentApproval(request: ContentApprovalRequest, senderId?: string) {
    const providers = this.getProvidersForType('approval', senderId);
    const result = await sendContentApprovalNotification(request, providers);
    if (senderId && result.userId) {
      await this.createNotification({
        userId: result.userId,
        senderId,
        type: result.type,
        channel: result.channel,
        status: result.status,
        title: result.title,
        message: result.message,
        error: result.error ?? undefined,
        metadata: result.metadata,
      });
    }
    return result;
  }

  async dispatchPublishing(request: PublishingNotificationRequest, senderId?: string) {
    const providers = this.getProvidersForType('publishing', senderId);
    const result = await sendPublishingNotification(request, providers);
    if (senderId && result.userId) {
      await this.createNotification({
        userId: result.userId,
        senderId,
        type: result.type,
        channel: result.channel,
        status: result.status,
        title: result.title,
        message: result.message,
        error: result.error ?? undefined,
        metadata: result.metadata,
      });
    }
    return result;
  }

  async dispatchSubscriptionReminder(request: SubscriptionReminderRequest, senderId?: string) {
    const providers = this.getProvidersForType('subscription', senderId);
    const result = await sendSubscriptionReminder(request, providers);
    if (senderId && result.userId) {
      await this.createNotification({
        userId: result.userId,
        senderId,
        type: result.type,
        channel: result.channel,
        status: result.status,
        title: result.title,
        message: result.message,
        error: result.error ?? undefined,
        metadata: result.metadata,
      });
    }
    return result;
  }

  async getAdminHistory(filters: HistoryQueryFilters = {}) {
    const buildConditions = (f: HistoryQueryFilters) => {
      const conditions = [];

      if (f.userId) conditions.push(eq(schema.notifications.userId, f.userId));
      if (f.type) conditions.push(eq(schema.notifications.type, f.type as any));
      if (f.status) conditions.push(eq(schema.notifications.status, f.status as any));
      if (f.channel) conditions.push(eq(schema.notifications.channel, f.channel as any));
      if (f.priority) conditions.push(eq(schema.notifications.priority, f.priority as any));
      if (f.senderId) conditions.push(eq(schema.notifications.senderId, f.senderId));
      if (f.startDate) conditions.push(gte(schema.notifications.createdAt, new Date(f.startDate)));
      if (f.endDate) conditions.push(lte(schema.notifications.createdAt, new Date(f.endDate)));
      if (f.isRead !== undefined) {
        const isReadBool = f.isRead === true || f.isRead === 'true';
        conditions.push(eq(schema.notifications.isRead, isReadBool));
      }
      if (f.search) {
        conditions.push(
          or(
            like(schema.notifications.title, `%${f.search}%`),
            like(schema.notifications.message, `%${f.search}%`),
          )
        );
      }

      return conditions.length > 0 ? and(...conditions) : undefined;
    };

    const queryConditions = buildConditions(filters);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const orderByClause = sortOrder === 'asc'
      ? [schema.notifications[sortBy]]
      : [desc(schema.notifications[sortBy])];

    const [result, countResult] = await Promise.all([
      this.db.query.notifications.findMany({
        where: queryConditions,
        offset: skip,
        limit,
        orderBy: orderByClause,
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          sender: {
            columns: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(schema.notifications).where(queryConditions),
    ]);

    return {
      data: result,
      pagination: {
        total: Number(countResult[0]?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Notification Triggers
  // ---------------------------------------------------------------------------

  async triggerContentApproval(request: ContentApprovalRequest) {
    const providers = this.getProvidersForType('approval');
    return sendContentApprovalNotification(request, providers);
  }

  async triggerPublishing(request: PublishingNotificationRequest) {
    const providers = this.getProvidersForType('publishing');
    const result = await sendPublishingNotification(request, providers);

    const notifType = request.isSuccess ? 'CONTENT_PUBLISHED' : 'CONTENT_PUBLISH_FAILED';
    const existing = await this.findExistingNotification(request.customer.id, notifType, 'scheduled_post', request.postId);
    if (existing) return existing;

    if (result.userId) {
      return this.createNotification({
        userId: result.userId,
        type: result.type,
        channel: result.channel,
        status: result.status,
        title: result.title,
        message: result.message,
        error: result.error ?? undefined,
        relatedEntityType: 'scheduled_post',
        relatedEntityId: request.postId,
        metadata: result.metadata,
      });
    }
    return result;
  }

  async triggerSubscriptionReminder(request: SubscriptionReminderRequest) {
    const providers = this.getProvidersForType('subscription');
    return sendSubscriptionReminder(request, providers);
  }

  async triggerCalendarUploaded(data: {
    userId: string;
    calendarJobId: string;
    calendarPostId?: string;
    downloadUrl?: string | null;
  }) {
    const existing = await this.findExistingNotification(data.userId, 'CALENDAR_UPLOADED', 'calendar_generation_job', data.calendarJobId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'CALENDAR_UPLOADED',
      channel: 'BOTH',
      priority: 'NORMAL',
      title: 'Calendar Ready for Download',
      message: 'Your content calendar has been generated and is ready for download.',
      relatedEntityType: 'calendar_generation_job',
      relatedEntityId: data.calendarJobId,
      actionUrl: data.downloadUrl,
      metadata: {
        calendarPostId: data.calendarPostId,
        downloadUrl: data.downloadUrl,
      },
    });
  }

  async triggerKycApproved(data: { userId: string; businessName: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SERVICE_UPDATE',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'KYC Verification Approved',
      message: `Your business verification for "${data.businessName}" has been approved. You now have full access to platform features.`,
      relatedEntityType: 'kyc',
      actionUrl: '/dashboard/channels',
      metadata: { businessName: data.businessName, status: 'approved' },
    });
  }

  async triggerKycRejected(data: { userId: string; businessName: string; reason?: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SERVICE_UPDATE',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'KYC Verification Rejected',
      message: `Your business verification for "${data.businessName}" was rejected.${data.reason ? ` Reason: ${data.reason}` : ''}`,
      relatedEntityType: 'kyc',
      actionUrl: '/dashboard/channels',
      metadata: { businessName: data.businessName, status: 'rejected', reason: data.reason },
    });
  }

  async triggerKycResubmissionRequired(data: { userId: string; businessName: string; reason?: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SERVICE_UPDATE',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'KYC Resubmission Required',
      message: `Your business verification for "${data.businessName}" requires updated documentation.${data.reason ? ` Reason: ${data.reason}` : ''}`,
      relatedEntityType: 'kyc',
      actionUrl: '/dashboard/channels',
      metadata: { businessName: data.businessName, status: 'resubmission_required', reason: data.reason },
    });
  }

  async triggerKycSubmitted(data: { userId: string; businessName: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SERVICE_UPDATE',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'KYC Verification Submitted',
      message: `Your business verification for "${data.businessName}" was submitted and is pending review.`,
      relatedEntityType: 'kyc',
      actionUrl: '/dashboard/channels',
      metadata: { businessName: data.businessName, status: 'pending' },
    });
  }

  async triggerAccountConnected(data: { userId: string; platform: string; accountHandle: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'ACCOUNT_CONNECTION_CONNECTED',
      channel: 'BOTH',
      priority: 'NORMAL',
      title: `${data.platform} Account Connected`,
      message: `Your ${data.platform} account (${data.accountHandle}) has been successfully connected.`,
      relatedEntityType: 'social_account',
      relatedEntityId: data.accountHandle,
      actionUrl: '/dashboard/social-accounts',
      metadata: {
        platform: data.platform,
        accountHandle: data.accountHandle,
      },
    });
  }

  async triggerAccountDisconnected(data: { userId: string; platform: string; accountHandle: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'ACCOUNT_CONNECTION_DISCONNECTED',
      channel: 'BOTH',
      priority: 'HIGH',
      title: `${data.platform} Account Disconnected`,
      message: `Your ${data.platform} account (${data.accountHandle}) has been disconnected. Please reconnect to continue scheduling posts.`,
      relatedEntityType: 'social_account',
      relatedEntityId: data.accountHandle,
      actionUrl: '/dashboard/social-accounts',
      metadata: {
        platform: data.platform,
        accountHandle: data.accountHandle,
      },
    });
  }

  async triggerAccountReauthorizationRequired(data: { userId: string; platform: string; accountHandle: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'ACCOUNT_CONNECTION_REAUTHORIZATION_REQUIRED',
      channel: 'BOTH',
      priority: 'HIGH',
      title: `${data.platform} Reauthorization Required`,
      message: `Your ${data.platform} account (${data.accountHandle}) needs to be reauthorized. Please connect again to resume automated posting.`,
      relatedEntityType: 'social_account',
      relatedEntityId: data.accountHandle,
      actionUrl: '/dashboard/social-accounts',
      metadata: {
        platform: data.platform,
        accountHandle: data.accountHandle,
      },
    });
  }

  async triggerAccountReconnected(data: { userId: string; platform: string; accountHandle: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'ACCOUNT_CONNECTION_RECONNECTED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: `${data.platform} Account Reconnected`,
      message: `Your ${data.platform} account (${data.accountHandle}) has been successfully reconnected.`,
      relatedEntityType: 'social_account',
      relatedEntityId: data.accountHandle,
      actionUrl: '/dashboard/social-accounts',
      metadata: {
        platform: data.platform,
        accountHandle: data.accountHandle,
      },
    });
  }

  async triggerTicketReceived(data: { userId: string; ticketId: string; subject: string; category: string }) {
    const existing = await this.findExistingNotification(data.userId, 'TICKET_RECEIVED', 'support_ticket', data.ticketId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'TICKET_RECEIVED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'Support Ticket Received',
      message: `We received your support ticket: "${data.subject}" (${data.category}). Our team will respond shortly.`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: data.ticketId,
      actionUrl: '/dashboard/support',
      metadata: {
        ticketId: data.ticketId,
        subject: data.subject,
        category: data.category,
      },
    });
  }

  async triggerTicketAssigned(data: { userId: string; ticketId: string; subject: string; assignedToStaffName: string }) {
    const existing = await this.findExistingNotification(data.userId, 'TICKET_ASSIGNED', 'support_ticket', data.ticketId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'TICKET_ASSIGNED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'Support Ticket Assigned',
      message: `Your ticket "${data.subject}" has been assigned to ${data.assignedToStaffName}.`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: data.ticketId,
      actionUrl: '/dashboard/support',
      metadata: {
        ticketId: data.ticketId,
        subject: data.subject,
        assignedToStaffName: data.assignedToStaffName,
      },
    });
  }

  async triggerTicketResponded(data: { userId: string; ticketId: string; subject: string }) {
    const existing = await this.findExistingNotification(data.userId, 'TICKET_RESPONDED', 'support_ticket', data.ticketId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'TICKET_RESPONDED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'New Response on Support Ticket',
      message: `There is a new response on your ticket "${data.subject}".`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: data.ticketId,
      actionUrl: '/dashboard/support',
      metadata: {
        ticketId: data.ticketId,
        subject: data.subject,
      },
    });
  }

  async triggerTicketResolved(data: { userId: string; ticketId: string; subject: string }) {
    const existing = await this.findExistingNotification(data.userId, 'TICKET_RESOLVED', 'support_ticket', data.ticketId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'TICKET_RESOLVED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'Support Ticket Resolved',
      message: `Your ticket "${data.subject}" has been marked as resolved.`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: data.ticketId,
      actionUrl: '/dashboard/support',
      metadata: {
        ticketId: data.ticketId,
        subject: data.subject,
      },
    });
  }

  async triggerTicketClosed(data: { userId: string; ticketId: string; subject: string }) {
    const existing = await this.findExistingNotification(data.userId, 'TICKET_CLOSED', 'support_ticket', data.ticketId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'TICKET_CLOSED',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'Support Ticket Closed',
      message: `Your ticket "${data.subject}" has been closed.`,
      relatedEntityType: 'support_ticket',
      relatedEntityId: data.ticketId,
      actionUrl: '/dashboard/support',
      metadata: {
        ticketId: data.ticketId,
        subject: data.subject,
      },
    });
  }

  async triggerSubscriptionPaymentPending(data: { userId: string; subscriptionId?: string; paymentId?: string; amount: number; currency: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_PAYMENT_PENDING',
      channel: 'IN_APP',
      priority: 'NORMAL',
      title: 'Payment Pending',
      message: `Your payment of ${data.currency} ${(data.amount / 100).toFixed(2)} is pending verification.`,
      relatedEntityType: 'payment',
      relatedEntityId: data.paymentId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
      },
    });
  }

  async triggerSubscriptionPlanChanged(data: { userId: string; subscriptionId?: string; planName: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_PLAN_CHANGED',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'Subscription Plan Updated',
      message: `Your subscription has been updated to the ${data.planName} plan.`,
      relatedEntityType: 'subscription',
      relatedEntityId: data.subscriptionId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
        planName: data.planName,
      },
    });
  }

  async triggerSubscriptionPaymentSuccess(data: { userId: string; subscriptionId: string; paymentId: string; amount: number; currency: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_PAYMENT_SUCCESS',
      channel: 'BOTH',
      priority: 'NORMAL',
      title: 'Payment Successful',
      message: `Your payment of ${data.currency} ${(data.amount / 100).toFixed(2)} was successful.`,
      relatedEntityType: 'subscription',
      relatedEntityId: data.subscriptionId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
      },
    });
  }

  async triggerSubscriptionPaymentFailed(data: { userId: string; subscriptionId: string; paymentId: string; amount: number; currency: string; reason?: string }) {
    const existing = await this.findExistingNotification(data.userId, 'SUBSCRIPTION_PAYMENT_FAILED', 'payment', data.paymentId);
    if (existing) return existing;

    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_PAYMENT_FAILED',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'Payment Failed',
      message: `Your payment of ${data.currency} ${(data.amount / 100).toFixed(2)} failed. Please update your payment method.${data.reason ? ` Reason: ${data.reason}` : ''}`,
      relatedEntityType: 'subscription',
      relatedEntityId: data.subscriptionId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
        reason: data.reason,
      },
    });
  }

  async triggerInvoiceAvailable(data: { userId: string; subscriptionId: string; invoiceId: string; invoiceNumber: string; amount: number; currency: string; pdfUrl?: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_INVOICE_AVAILABLE',
      channel: 'EMAIL',
      priority: 'NORMAL',
      title: 'Invoice Available',
      message: `Your invoice ${data.invoiceNumber} for ${data.currency} ${(data.amount / 100).toFixed(2)} is now available.`,
      relatedEntityType: 'invoice',
      relatedEntityId: data.invoiceId,
      actionUrl: data.pdfUrl,
      metadata: {
        subscriptionId: data.subscriptionId,
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        pdfUrl: data.pdfUrl,
      },
    });
  }

  async triggerSubscriptionExpired(data: { userId: string; subscriptionId: string }) {
    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_EXPIRED',
      channel: 'BOTH',
      priority: 'HIGH',
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Please renew to continue using the platform.',
      relatedEntityType: 'subscription',
      relatedEntityId: data.subscriptionId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
      },
    });
  }

  async triggerSubscriptionRenewalReminder(data: { userId: string; subscriptionId: string; daysToExpiry: number; expiryDate: Date }) {
    const isExpired = data.daysToExpiry < 0;
    const absDays = Math.abs(data.daysToExpiry);

    return this.createNotification({
      userId: data.userId,
      type: 'SUBSCRIPTION_RENEWAL_REMINDER',
      channel: 'EMAIL',
      priority: isExpired ? 'HIGH' : 'NORMAL',
      title: isExpired
        ? `Action Required: Your subscription expired ${absDays} day(s) ago`
        : `Reminder: Your subscription expires in ${absDays} day(s)`,
      message: isExpired
        ? `Your AI Social Media Manager subscription expired on ${data.expiryDate.toDateString()}. Please renew your subscription to avoid service interruption.`
        : `Your AI Social Media Manager subscription will expire on ${data.expiryDate.toDateString()}. Renew now to ensure uninterrupted service.`,
      relatedEntityType: 'subscription',
      relatedEntityId: data.subscriptionId,
      actionUrl: '/dashboard/billing',
      metadata: {
        subscriptionId: data.subscriptionId,
        daysToExpiry: data.daysToExpiry,
        expiryDate: data.expiryDate.toISOString(),
      },
    });
  }

  async triggerSecurityNotice(data: { userId?: string; title: string; message: string; broadcast?: boolean }) {
    let targets: any[] = [];
    if (data.userId) {
      targets = await this.db.query.users.findMany({ where: eq(schema.users.id, data.userId) });
    } else if (data.broadcast) {
      // Broadcast to every active user: customers + admin staff
      targets = await this.db.query.users.findMany({ where: eq(schema.users.isActive, true) });
    }

    const records = await this.createBulkNotifications(
      targets.map((user) => ({
        userId: user.id,
        type: 'SECURITY_NOTICE',
        channel: 'IN_APP',
        priority: 'URGENT',
        title: data.title,
        message: data.message,
        metadata: { broadcast: data.broadcast },
      }))
    );

    return { totalTargeted: targets.length, records };
  }

  async triggerFeatureUpdate(data: { userId?: string; title: string; message: string; broadcast?: boolean }) {
    let targets: any[] = [];
    if (data.userId) {
      targets = await this.db.query.users.findMany({ where: eq(schema.users.id, data.userId) });
    } else if (data.broadcast) {
      targets = await this.db.query.users.findMany({ where: eq(schema.users.isActive, true) });
    }

    const records = await this.createBulkNotifications(
      targets.map((user) => ({
        userId: user.id,
        type: 'FEATURE_UPDATE',
        channel: 'IN_APP',
        priority: 'NORMAL',
        title: data.title,
        message: data.message,
        metadata: { broadcast: data.broadcast },
      }))
    );

    return { totalTargeted: targets.length, records };
  }

  async triggerServiceUpdate(data: { userId?: string; title: string; message: string; broadcast?: boolean }) {
    let targets: any[] = [];
    if (data.userId) {
      targets = await this.db.query.users.findMany({ where: eq(schema.users.id, data.userId) });
    } else if (data.broadcast) {
      targets = await this.db.query.users.findMany({ where: eq(schema.users.isActive, true) });
    }

    const records = await this.createBulkNotifications(
      targets.map((user) => ({
        userId: user.id,
        type: 'SERVICE_UPDATE',
        channel: 'IN_APP',
        priority: 'NORMAL',
        title: data.title,
        message: data.message,
        metadata: { broadcast: data.broadcast },
      }))
    );

    return { totalTargeted: targets.length, records };
  }
}
