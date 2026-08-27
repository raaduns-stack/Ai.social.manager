import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { MailerService } from '../mailer/mailer.service';
import { UserRole } from '../common/enums/roles.enum';

// Import the existing admin notification pure functions
import { sendSystemAnnouncement, AnnouncementRequest } from '../admin/notifications/system-announcements';
import { sendMaintenanceNotification, MaintenanceNotificationRequest } from '../admin/notifications/maintenence';
import { sendContentApprovalNotification, ContentApprovalRequest } from '../admin/notifications/content-approval';
import { sendPublishingNotification, PublishingNotificationRequest } from '../admin/notifications/publishing';
import { sendSubscriptionReminder, SubscriptionReminderRequest } from '../admin/notifications/subscription-reminder';
import { getNotificationHistory, HistoryQueryFilters } from '../admin/notifications/history';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly mailerService: MailerService,
  ) {}

  // ---------------------------------------------------------------------------
  // Provider Helpers (implementing callbacks for existing pure functions)
  // ---------------------------------------------------------------------------

  private async checkUserPreference(userId: string, type: string, channel: 'email' | 'inApp'): Promise<boolean> {
    try {
      // 1. Check global platform setting for this type
      const globalSetting = await this.db.query.notificationTypeSettings.findFirst({
        where: eq(schema.notificationTypeSettings.notificationType, type),
      });

      if (globalSetting && !globalSetting.isEnabledGlobally) {
        return false; // Disabled platform-wide
      }

      if (globalSetting) {
        if (channel === 'email' && !globalSetting.emailAvailable) return false;
        if (channel === 'inApp' && !globalSetting.inAppAvailable) return false;
      }

      // 2. Check user preference
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

      return true; // Default to enabled if no explicit override is saved
    } catch (error) {
      this.logger.error(`Error checking notification preferences for user ${userId}:`, error);
      return true;
    }
  }

  private getProvidersForType(notificationType: string) {
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
        // Resolve user to check preference
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
          type: data.type || notificationType.toUpperCase(),
          title: data.title,
          message: data.message,
          channel: 'IN_APP',
          status: 'SENT',
          isRead: false,
          metadata: data,
        });
      },

      saveNotificationLog: async (recordOrRecords: any) => {
        const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
        if (records.length === 0) return;

        const dbRecords = records.map((r) => ({
          userId: r.userId,
          type: r.type,
          title: r.title,
          message: r.message,
          channel: r.channel,
          status: r.status,
          error: r.error,
          metadata: r.metadata,
        }));

        await this.db.insert(schema.notifications).values(dbRecords);
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin Operations
  // ---------------------------------------------------------------------------

  async dispatchSystemAnnouncement(request: AnnouncementRequest) {
    const providers = this.getProvidersForType('announcement');
    return sendSystemAnnouncement(request, providers);
  }

  async dispatchMaintenance(request: MaintenanceNotificationRequest) {
    const providers = this.getProvidersForType('maintenance');
    return sendMaintenanceNotification(request, providers);
  }

  async getAdminHistory(filters: HistoryQueryFilters = {}) {
    const repository = {
      findNotifications: async (f: HistoryQueryFilters, skip: number, limit: number) => {
        const conditions = [];
        if (f.userId) conditions.push(eq(schema.notifications.userId, f.userId));
        if (f.type) conditions.push(eq(schema.notifications.type, f.type));
        if (f.status) conditions.push(eq(schema.notifications.status, f.status));

        const queryConditions = conditions.length > 0 ? and(...conditions) : undefined;

        return this.db.query.notifications.findMany({
          where: queryConditions,
          offset: skip,
          limit: limit,
          orderBy: [desc(schema.notifications.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });
      },
      countNotifications: async (f: HistoryQueryFilters) => {
        const conditions = [];
        if (f.userId) conditions.push(eq(schema.notifications.userId, f.userId));
        if (f.type) conditions.push(eq(schema.notifications.type, f.type));
        if (f.status) conditions.push(eq(schema.notifications.status, f.status));

        const queryConditions = conditions.length > 0 ? and(...conditions) : undefined;
        
        const list = await this.db.query.notifications.findMany({
          where: queryConditions,
          columns: { id: true },
        });
        return list.length;
      },
    };

    return getNotificationHistory(filters, repository);
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
    return sendPublishingNotification(request, providers);
  }

  async triggerSubscriptionReminder(request: SubscriptionReminderRequest) {
    const providers = this.getProvidersForType('subscription');
    return sendSubscriptionReminder(request, providers);
  }

  // ---------------------------------------------------------------------------
  // Customer Operations (In-App Inbox Feed)
  // ---------------------------------------------------------------------------

  async getCustomerFeed(userId: string, unreadOnly = false) {
    const conditions = [eq(schema.notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(schema.notifications.isRead, false));
    }

    return this.db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.notifications.createdAt)],
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const [updated] = await this.db
      .update(schema.notifications)
      .set({
        isRead: true,
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
}
