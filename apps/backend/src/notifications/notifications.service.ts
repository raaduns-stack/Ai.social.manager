import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc, sql, gt, lt, gte, lte, like, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { MailerService } from '../mailer/mailer.service';
import { UserRole } from '../common/enums/roles.enum';
import {
  NotificationType,
  NOTIFICATION_TYPE_VALUES,
  DeliveryStatus,
  DELIVERY_STATUS_VALUES,
  NotificationChannel,
  NOTIFICATION_CHANNEL_VALUES,
  NotificationPriority,
  NOTIFICATION_PRIORITY_VALUES,
} from '../common/enums';
import sanitizeHtml from 'sanitize-html';

// Import the existing admin notification pure functions
import { sendSystemAnnouncement, AnnouncementRequest } from '../admin/notifications/system-announcements';
import { sendMaintenanceNotification, MaintenanceNotificationRequest } from '../admin/notifications/maintenence';
import { sendContentApprovalNotification, ContentApprovalRequest } from '../admin/notifications/content-approval';
import { sendPublishingNotification, PublishingNotificationRequest } from '../admin/notifications/publishing';
import { sendSubscriptionReminder, SubscriptionReminderRequest } from '../admin/notifications/subscription-reminder';
import { HistoryQueryFilters } from '../admin/notifications/history';

type Database = PostgresJsDatabase<typeof schema>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        'code', 'pre', 'hr', 'sub', 'sup', 'img',
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height', 'style'],
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
      allowedSchemes: ['http', 'https', 'mailto', 'data'],
      allowedSchemesByTag: {
        a: ['http', 'https', 'mailto', 'data'],
        img: ['http', 'https', 'data'],
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
    let validSenderId: string | null = null;
    if (data.senderId && UUID_REGEX.test(data.senderId)) {
      const sender = await this.db.query.users.findFirst({
        where: eq(schema.users.id, data.senderId),
        columns: { id: true },
      });
      if (sender) validSenderId = sender.id;
    }

    const validRelatedEntityId =
      data.relatedEntityId && UUID_REGEX.test(data.relatedEntityId)
        ? data.relatedEntityId
        : null;

    const mergedMetadata = {
      ...(data.metadata || {}),
      ...(data.relatedEntityId && !validRelatedEntityId
        ? { rawRelatedEntityId: data.relatedEntityId }
        : {}),
    };

    const safeType = NOTIFICATION_TYPE_VALUES.includes(data.type as any)
      ? data.type
      : 'SYSTEM_ANNOUNCEMENT';
    const safeChannel = NOTIFICATION_CHANNEL_VALUES.includes(data.channel as any)
      ? data.channel
      : 'IN_APP';
    const safeStatus = DELIVERY_STATUS_VALUES.includes(data.status as any)
      ? data.status
      : 'SENT';
    const safePriority = NOTIFICATION_PRIORITY_VALUES.includes(data.priority as any)
      ? data.priority
      : 'NORMAL';

    const sanitizedMessage = this.sanitizeHtml(data.message);
    const [record] = await this.db
      .insert(schema.notifications)
      .values({
        userId: data.userId,
        senderId: validSenderId,
        type: safeType as any,
        channel: safeChannel as any,
        status: safeStatus as any,
        priority: safePriority as any,
        title: data.title,
        message: sanitizedMessage,
        error: data.error,
        readAt: data.readAt,
        sentAt: data.sentAt || new Date(),
        scheduledFor: data.scheduledFor,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: validRelatedEntityId,
        actionUrl: data.actionUrl,
        metadata: mergedMetadata,
      })
      .returning();
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

    const senderIds = Array.from(
      new Set(
        records
          .map((r) => r.senderId)
          .filter((id): id is string => !!id && UUID_REGEX.test(id)),
      ),
    );
    let validSenderIdSet = new Set<string>();
    if (senderIds.length > 0) {
      const validSenders = await this.db.query.users.findMany({
        where: inArray(schema.users.id, senderIds),
        columns: { id: true },
      });
      validSenderIdSet = new Set(validSenders.map((s) => s.id));
    }

    const values = records.map((r) => {
      const validSenderId = r.senderId && validSenderIdSet.has(r.senderId) ? r.senderId : null;
      const validRelatedEntityId =
        r.relatedEntityId && UUID_REGEX.test(r.relatedEntityId) ? r.relatedEntityId : null;
      const mergedMetadata = {
        ...(r.metadata || {}),
        ...(r.relatedEntityId && !validRelatedEntityId
          ? { rawRelatedEntityId: r.relatedEntityId }
          : {}),
      };

      const safeType = NOTIFICATION_TYPE_VALUES.includes(r.type as any)
        ? r.type
        : 'SYSTEM_ANNOUNCEMENT';
      const safeChannel = NOTIFICATION_CHANNEL_VALUES.includes(r.channel as any)
        ? r.channel
        : 'IN_APP';
      const safeStatus = DELIVERY_STATUS_VALUES.includes(r.status as any)
        ? r.status
        : 'SENT';
      const safePriority = NOTIFICATION_PRIORITY_VALUES.includes(r.priority as any)
        ? r.priority
        : 'NORMAL';

      return {
        userId: r.userId,
        senderId: validSenderId,
        type: safeType as any,
        channel: safeChannel as any,
        status: safeStatus as any,
        priority: safePriority as any,
        title: r.title,
        message: this.sanitizeHtml(r.message),
        error: r.error,
        sentAt: new Date(),
        scheduledFor: r.scheduledFor,
        relatedEntityType: r.relatedEntityType,
        relatedEntityId: validRelatedEntityId,
        actionUrl: r.actionUrl,
        metadata: mergedMetadata,
      };
    });

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
    if (!userIds || userIds.length === 0) {
      return { valid: [], invalid: [] };
    }

    const validUuidList = userIds.filter((id) => typeof id === 'string' && UUID_REGEX.test(id));
    const nonUuidList = userIds.filter((id) => !validUuidList.includes(id));

    let foundUsers: Array<{ id: string }> = [];
    if (validUuidList.length > 0) {
      foundUsers = await this.db.query.users.findMany({
        where: inArray(schema.users.id, validUuidList),
        columns: { id: true, role: true },
      });
    }

    const validUserIds = new Set(foundUsers.map((u) => u.id));
    const invalid = [...nonUuidList, ...validUuidList.filter((id) => !validUserIds.has(id))];

    return { valid: Array.from(validUserIds), invalid };
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

  private getProvidersForType(notificationType: string, senderId?: string, options?: { targetAudience?: string }) {
    return {
      getCustomers: async (userIds?: string[]) => {
        let whereCondition: any;
        if (userIds && userIds.length > 0) {
          whereCondition = inArray(schema.users.id, userIds);
        } else if (options?.targetAudience === 'STAFF_DESIGNERS') {
          whereCondition = and(
            eq(schema.users.isActive, true),
            inArray(schema.users.role, [
              UserRole.SUPER_ADMIN,
              UserRole.ACCOUNT_MANAGER,
              UserRole.REVIEWER,
              UserRole.SUPPORT_STAFF,
              UserRole.DESIGNER,
            ]),
          );
        } else if (options?.targetAudience === 'ALL') {
          whereCondition = eq(schema.users.isActive, true);
        } else {
          whereCondition = eq(schema.users.role, UserRole.USER);
        }

        let list = await this.db.query.users.findMany({ where: whereCondition });
        if (senderId && options?.targetAudience !== 'STAFF_DESIGNERS' && options?.targetAudience !== 'ALL') {
          list = list.filter((u) => u.id !== senderId);
        }
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
      },

      saveNotificationLog: async (recordOrRecords: any) => {
        const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
        if (records.length === 0) return;

        let validSenderId: string | null = null;
        if (senderId && UUID_REGEX.test(senderId)) {
          const s = await this.db.query.users.findFirst({
            where: eq(schema.users.id, senderId),
            columns: { id: true },
          });
          if (s) validSenderId = s.id;
        }

        const dbRecords = records.map((r) => {
          const validRelatedEntityId =
            r.relatedEntityId && UUID_REGEX.test(r.relatedEntityId)
              ? r.relatedEntityId
              : null;
          const mergedMetadata = {
            ...(r.metadata || {}),
            ...(r.relatedEntityId && !validRelatedEntityId
              ? { rawRelatedEntityId: r.relatedEntityId }
              : {}),
          };

          const safeType = NOTIFICATION_TYPE_VALUES.includes(r.type as any)
            ? r.type
            : 'SYSTEM_ANNOUNCEMENT';
          const safeChannel = NOTIFICATION_CHANNEL_VALUES.includes(r.channel as any)
            ? r.channel
            : 'IN_APP';
          const safeStatus = DELIVERY_STATUS_VALUES.includes(r.status as any)
            ? r.status
            : 'SENT';
          const safePriority = NOTIFICATION_PRIORITY_VALUES.includes(r.priority as any)
            ? r.priority
            : 'NORMAL';

          return {
            userId: r.userId,
            senderId: validSenderId,
            type: safeType as any,
            title: r.title,
            message: r.message,
            channel: safeChannel as any,
            status: safeStatus as any,
            error: r.error,
            priority: safePriority as any,
            scheduledFor: r.scheduledFor,
            relatedEntityType: r.relatedEntityType,
            relatedEntityId: validRelatedEntityId,
            actionUrl: r.actionUrl,
            metadata: mergedMetadata,
          };
        });

        await this.db.insert(schema.notifications).values(dbRecords as any);

        // Mirror to designer_notifications for any designer recipients
        try {
          const recipientIds = Array.from(new Set(records.map((r) => r.userId)));
          const designers = await this.db.query.users.findMany({
            where: and(
              inArray(schema.users.id, recipientIds),
              eq(schema.users.role, UserRole.DESIGNER),
            ),
            columns: { id: true },
          });
          const designerIdSet = new Set(designers.map((d) => d.id));

          const designerNotifEntries = records
            .filter((r) => designerIdSet.has(r.userId))
            .map((r) => {
              let dType: 'system' | 'task' | 'revision' | 'approved' | 'payment' = 'system';
              const rawType = (r.type || '').toUpperCase();
              if (rawType.includes('TASK') || rawType.includes('TICKET')) dType = 'task';
              else if (rawType.includes('PAYMENT') || rawType.includes('INVOICE') || rawType.includes('PAYOUT')) dType = 'payment';
              else if (rawType.includes('APPROVAL') || rawType.includes('APPROVED')) dType = 'approved';
              else if (rawType.includes('REVISION')) dType = 'revision';

              return {
                designerId: r.userId,
                type: dType as any,
                title: r.title,
                message: r.message ? r.message.replace(/<[^>]*>?/gm, '').trim() : '',
              };
            });

          if (designerNotifEntries.length > 0) {
            await this.db.insert(schema.designerNotifications).values(designerNotifEntries);
          }
        } catch (mirrorErr) {
          this.logger.warn(`Failed to mirror notifications to designerNotifications: ${mirrorErr?.message}`);
        }
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
    let senderFirstName: string | undefined;
    if (senderId) {
      const sender = await this.db.query.users.findFirst({
        where: eq(schema.users.id, senderId),
        columns: { fullName: true },
      });
      if (sender?.fullName) {
        senderFirstName = sender.fullName.trim().split(' ')[0];
      }
    }
    const cleanTitle = (request.title || '').replace(/\[\s*admin\s*copy\s*\]/gi, '').trim();
    const targetAudience = request.metadata?.targetAudience;
    const providers = this.getProvidersForType('announcement', senderId, { targetAudience });
    const result = await sendSystemAnnouncement({ ...request, title: cleanTitle || 'Notification', senderFirstName }, providers);
    return result;
  }

  async dispatchMaintenance(request: MaintenanceNotificationRequest, senderId?: string) {
    const providers = this.getProvidersForType('maintenance', senderId);
    const result = await sendMaintenanceNotification(request, providers);
    return result;
  }

  async dispatchContentApproval(request: ContentApprovalRequest, senderId?: string) {
    const providers = this.getProvidersForType('approval', senderId);
    const result = await sendContentApprovalNotification(request, providers);
    return result;
  }

  async dispatchPublishing(request: PublishingNotificationRequest, senderId?: string) {
    const providers = this.getProvidersForType('publishing', senderId);
    const result = await sendPublishingNotification(request, providers);
    return result;
  }

  async dispatchSubscriptionReminder(request: SubscriptionReminderRequest, senderId?: string) {
    const providers = this.getProvidersForType('subscription', senderId);
    const result = await sendSubscriptionReminder(request, providers);
    return result;
  }

  async getAdminHistory(filters: HistoryQueryFilters = {}) {
    const buildConditions = (f: HistoryQueryFilters) => {
      const conditions = [];

      if (f.userId && UUID_REGEX.test(f.userId)) {
        conditions.push(eq(schema.notifications.userId, f.userId));
      }
      if (f.senderId && UUID_REGEX.test(f.senderId)) {
        conditions.push(eq(schema.notifications.senderId, f.senderId));
      }
      if (f.type && f.type !== 'all' && NOTIFICATION_TYPE_VALUES.includes(f.type as any)) {
        conditions.push(eq(schema.notifications.type, f.type as any));
      }
      if (f.status && f.status !== 'all' && DELIVERY_STATUS_VALUES.includes(f.status as any)) {
        conditions.push(eq(schema.notifications.status, f.status as any));
      }
      if (f.channel && f.channel !== 'all' && NOTIFICATION_CHANNEL_VALUES.includes(f.channel as any)) {
        conditions.push(eq(schema.notifications.channel, f.channel as any));
      }
      if (f.priority && f.priority !== 'all' && NOTIFICATION_PRIORITY_VALUES.includes(f.priority as any)) {
        conditions.push(eq(schema.notifications.priority, f.priority as any));
      }
      if (f.startDate && !isNaN(new Date(f.startDate).getTime())) {
        conditions.push(gte(schema.notifications.createdAt, new Date(f.startDate)));
      }
      if (f.endDate && !isNaN(new Date(f.endDate).getTime())) {
        conditions.push(lte(schema.notifications.createdAt, new Date(f.endDate)));
      }
      if (f.isRead !== undefined && f.isRead !== '' && (f.isRead as any) !== 'all') {
        const isReadBool = f.isRead === true || f.isRead === 'true';
        conditions.push(eq(schema.notifications.isRead, isReadBool));
      }
      if (f.search && f.search.trim()) {
        const q = f.search.trim();
        conditions.push(
          or(
            like(schema.notifications.title, `%${q}%`),
            like(schema.notifications.message, `%${q}%`),
          )
        );
      }

      return conditions.length > 0 ? and(...conditions) : undefined;
    };

    const queryConditions = buildConditions(filters);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const skip = (page - 1) * limit;

    const validSortColumns = ['createdAt', 'readAt', 'sentAt', 'updatedAt', 'title', 'type', 'status', 'priority'];
    const sortBy = validSortColumns.includes(filters.sortBy || '') ? filters.sortBy : 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const sortCol = schema.notifications[sortBy as keyof typeof schema.notifications] || schema.notifications.createdAt;
    const orderByClause = sortOrder === 'asc' ? [sortCol] : [desc(sortCol)];

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

  // ---------------------------------------------------------------------------
  // TASK, SUBMISSION & DESIGNER PAYMENT EVENT TRIGGERS
  // ---------------------------------------------------------------------------

  async triggerTaskEvent(payload: {
    taskId: string;
    designerId: string;
    taskTitle: string;
    eventType: 'assigned' | 'updated' | 'approaching_deadline' | 'overdue' | 'completed';
    senderId?: string;
    details?: string;
  }) {
    let notifType = 'TICKET_ASSIGNED';
    let title = `Task: ${payload.taskTitle}`;
    let message = `Task "${payload.taskTitle}" status has been updated.`;
    let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL';

    switch (payload.eventType) {
      case 'assigned':
        notifType = 'TICKET_ASSIGNED';
        title = `New Task Assigned: ${payload.taskTitle}`;
        message = `You have been assigned a new design task: "${payload.taskTitle}".${payload.details ? ` Details: ${payload.details}` : ''}`;
        break;
      case 'updated':
        notifType = 'TICKET_RESPONDED';
        title = `Task Updated: ${payload.taskTitle}`;
        message = `Task "${payload.taskTitle}" has been updated.${payload.details ? ` Notes: ${payload.details}` : ''}`;
        break;
      case 'approaching_deadline':
        notifType = 'TICKET_ASSIGNED';
        priority = 'HIGH';
        title = `Approaching Deadline: ${payload.taskTitle}`;
        message = `Upcoming deadline alert for task "${payload.taskTitle}".${payload.details ? ` ${payload.details}` : ''}`;
        break;
      case 'overdue':
        notifType = 'TICKET_ASSIGNED';
        priority = 'URGENT';
        title = `Task Overdue: ${payload.taskTitle}`;
        message = `Task "${payload.taskTitle}" is past its due date. Please complete and submit your work as soon as possible.`;
        break;
      case 'completed':
        notifType = 'TICKET_RESOLVED';
        title = `Task Completed: ${payload.taskTitle}`;
        message = `Task "${payload.taskTitle}" has been marked as complete. Thank you!`;
        break;
    }

    const created = await this.createNotification({
      userId: payload.designerId,
      senderId: payload.senderId,
      type: notifType,
      channel: 'BOTH',
      priority,
      title,
      message,
      relatedEntityType: 'task',
      relatedEntityId: payload.taskId,
      metadata: {
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        eventType: payload.eventType,
      },
    });

    // Mirror to designer_notifications
    try {
      await this.db.insert(schema.designerNotifications).values({
        designerId: payload.designerId,
        type: 'task',
        title,
        message,
      });
    } catch (err) {
      this.logger.warn(`Could not mirror task notification to designer_notifications: ${err?.message}`);
    }

    return created;
  }

  async triggerSubmissionEvent(payload: {
    submissionId: string;
    designerId: string;
    title: string;
    eventType: 'submitted' | 'reviewed' | 'revision_required' | 'rejected' | 'approved';
    senderId?: string;
    notes?: string;
  }) {
    let notifType = 'CONTENT_APPROVAL';
    let title = `Submission: ${payload.title}`;
    let message = `Your submission "${payload.title}" has been updated.`;
    let priority: 'NORMAL' | 'HIGH' = 'NORMAL';
    let designerType: 'approved' | 'revision' | 'system' = 'system';

    switch (payload.eventType) {
      case 'submitted':
        notifType = 'CONTENT_APPROVAL';
        title = `Design Submitted: ${payload.title}`;
        message = `Your design submission "${payload.title}" has been received and queued for review.`;
        designerType = 'system';
        break;
      case 'reviewed':
        notifType = 'CONTENT_APPROVAL';
        title = `Design Under Review: ${payload.title}`;
        message = `Your submission "${payload.title}" is currently under review by our design team.`;
        designerType = 'system';
        break;
      case 'revision_required':
        notifType = 'CONTENT_APPROVAL';
        priority = 'HIGH';
        title = `Revision Required: ${payload.title}`;
        message = `Revisions have been requested for "${payload.title}".${payload.notes ? ` Feedback: ${payload.notes}` : ''}`;
        designerType = 'revision';
        break;
      case 'rejected':
        notifType = 'CONTENT_PUBLISH_FAILED';
        priority = 'HIGH';
        title = `Submission Rejected: ${payload.title}`;
        message = `Your submission "${payload.title}" was rejected.${payload.notes ? ` Reason: ${payload.notes}` : ''}`;
        designerType = 'revision';
        break;
      case 'approved':
        notifType = 'CONTENT_APPROVAL';
        title = `Submission Approved! ${payload.title}`;
        message = `Congratulations! Your design submission "${payload.title}" has been approved.`;
        designerType = 'approved';
        break;
    }

    const created = await this.createNotification({
      userId: payload.designerId,
      senderId: payload.senderId,
      type: notifType,
      channel: 'BOTH',
      priority,
      title,
      message,
      relatedEntityType: 'submission',
      relatedEntityId: payload.submissionId,
      metadata: {
        submissionId: payload.submissionId,
        submissionTitle: payload.title,
        eventType: payload.eventType,
        notes: payload.notes,
      },
    });

    try {
      await this.db.insert(schema.designerNotifications).values({
        designerId: payload.designerId,
        type: designerType,
        title,
        message,
      });
    } catch (err) {
      this.logger.warn(`Could not mirror submission notification to designer_notifications: ${err?.message}`);
    }

    return created;
  }

  async triggerDesignerPaymentEvent(payload: {
    paymentId: string;
    designerId: string;
    amount: number;
    reference: string;
    status: 'pending' | 'approved' | 'processing' | 'successful' | 'failed' | 'declined';
    senderId?: string;
    notes?: string;
  }) {
    let notifType = 'SUBSCRIPTION_PAYMENT_SUCCESS';
    let title = `Payout: ${payload.reference}`;
    let message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} status is now ${payload.status.toUpperCase()}.`;
    let priority: 'NORMAL' | 'HIGH' = 'NORMAL';

    switch (payload.status) {
      case 'pending':
        notifType = 'SUBSCRIPTION_PAYMENT_PENDING';
        title = `Payout Queued: ${payload.reference}`;
        message = `A payout request of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) is pending review.`;
        break;
      case 'approved':
        notifType = 'SUBSCRIPTION_PAYMENT_PENDING';
        title = `Payout Approved: ${payload.reference}`;
        message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) has been approved and queued for processing.`;
        break;
      case 'processing':
        notifType = 'SUBSCRIPTION_PAYMENT_PENDING';
        title = `Payout Processing: ${payload.reference}`;
        message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) is currently being processed with the bank.`;
        break;
      case 'successful':
        notifType = 'SUBSCRIPTION_PAYMENT_SUCCESS';
        title = `Payout Successful: ${payload.reference}`;
        message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) has been successfully credited to your bank account!`;
        break;
      case 'failed':
        notifType = 'SUBSCRIPTION_PAYMENT_FAILED';
        priority = 'HIGH';
        title = `Payout Failed: ${payload.reference}`;
        message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) failed to process.${payload.notes ? ` Reason: ${payload.notes}` : ' Please verify your bank details.'}`;
        break;
      case 'declined':
        notifType = 'SUBSCRIPTION_PAYMENT_FAILED';
        priority = 'HIGH';
        title = `Payout Declined: ${payload.reference}`;
        message = `Your payout of ₦${(payload.amount / 100).toLocaleString()} (Ref: ${payload.reference}) was declined.${payload.notes ? ` Reason: ${payload.notes}` : ''}`;
        break;
    }

    const created = await this.createNotification({
      userId: payload.designerId,
      senderId: payload.senderId,
      type: notifType,
      channel: 'BOTH',
      priority,
      title,
      message,
      relatedEntityType: 'designer_payment',
      relatedEntityId: payload.paymentId,
      metadata: {
        paymentId: payload.paymentId,
        reference: payload.reference,
        status: payload.status,
        amount: payload.amount,
        notes: payload.notes,
      },
    });

    try {
      await this.db.insert(schema.designerNotifications).values({
        designerId: payload.designerId,
        type: 'payment',
        title,
        message,
      });
    } catch (err) {
      this.logger.warn(`Could not mirror payment notification to designer_notifications: ${err?.message}`);
    }

    return created;
  }
}

