import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { UpdateImageToCodeDto } from './dto/update-image-to-code.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DesignerService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  async getDashboardSummary(designerId: string) {
    const [
      totalSubmissions,
      statusCounts,
      recentSubmissions,
      attentionItems,
      upcomingTasks,
      earnings,
      approvedCount,
    ] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.submissions)
        .where(eq(schema.submissions.designerId, designerId)),

      this.db
        .select({
          status: schema.submissions.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.submissions)
        .where(eq(schema.submissions.designerId, designerId))
        .groupBy(schema.submissions.status),

      this.db
        .select({
          id: schema.submissions.id,
          title: schema.submissions.title,
          status: schema.submissions.status,
          category: schema.submissions.category,
          updatedAt: schema.submissions.updatedAt,
        })
        .from(schema.submissions)
        .where(eq(schema.submissions.designerId, designerId))
        .orderBy(desc(schema.submissions.updatedAt))
        .limit(4),

      this.db
        .select({
          id: schema.submissions.id,
          title: schema.submissions.title,
          status: schema.submissions.status,
        })
        .from(schema.submissions)
        .where(
          and(
            eq(schema.submissions.designerId, designerId),
            eq(schema.submissions.status, 'revision_required'),
          ),
        )
        .orderBy(desc(schema.submissions.updatedAt))
        .limit(5),

      this.db
        .select({
          id: schema.tasks.id,
          title: schema.tasks.title,
          dueDate: schema.tasks.dueDate,
          priority: schema.tasks.priority,
        })
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.assignedTo, designerId),
            inArray(schema.tasks.status, ['open', 'in_progress']),
          ),
        )
        .orderBy(schema.tasks.dueDate)
        .limit(5),

      this.db
        .select({
          amount: schema.designerPayments.amount,
          status: schema.designerPayments.status,
          createdAt: schema.designerPayments.createdAt,
        })
        .from(schema.designerPayments)
        .where(eq(schema.designerPayments.designerId, designerId)),

      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.submissions)
        .where(
          and(
            eq(schema.submissions.designerId, designerId),
            inArray(schema.submissions.status, ['approved', 'completed']),
          ),
        ),
    ]);

    const totalCount = totalSubmissions[0]?.count ?? 0;
    const approvedTotal = approvedCount[0]?.count ?? 0;
    const approvalRate = totalCount > 0 ? Math.round((approvedTotal / totalCount) * 100) : 0;

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
    }

    const totalEarned = earnings
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingEarnings = earnings
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    const lastPaid = earnings
      .filter((e) => e.status === 'paid')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const monthlyEarnings = this.getMonthlyEarnings(earnings);

    return {
      totalSubmissions: totalCount,
      approvalRate,
      totalEarned,
      pendingEarnings,
      lastPaidAmount: lastPaid?.amount ?? 0,
      monthlyEarnings,
      statusCounts: statusMap,
      recentSubmissions: recentSubmissions.map((s) => ({
        ...s,
        progress: this.getProgressPercent(s.status),
        updated: s.updatedAt.toISOString(),
      })),
      attentionItems: attentionItems.map((a) => ({
        id: a.id,
        title: a.title,
        reason: 'Revision required',
      })),
      upcomingTasks: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() ?? null,
        priority: t.priority,
      })),
    };
  }

  private getMonthlyEarnings(
    earnings: Array<{ amount: number; status: string; createdAt: Date }>,
  ): Array<{ m: string; v: number }> {
    const buckets = new Map<string, number>();
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push(key);
      buckets.set(key, 0);
    }
    for (const e of earnings) {
      if (e.status !== 'paid') continue;
      const key = `${e.createdAt.getFullYear()}-${e.createdAt.getMonth()}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + e.amount);
      }
    }
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months.map((key) => {
      const mo = Number(key.split('-')[1]);
      return {
        m: monthNames[mo],
        v: Math.round((buckets.get(key) ?? 0) / 100),
      };
    });
  }

  private getProgressPercent(status: string): number {
    const map: Record<string, number> = {
      draft: 10,
      submitted: 25,
      received: 35,
      under_review: 50,
      revision_required: 60,
      resubmitted: 70,
      approved: 85,
      completed: 100,
    };
    return map[status] ?? 0;
  }

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  async getProfile(designerId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) throw new NotFoundException('Designer not found');

    let profile = await this.db.query.designerProfiles.findFirst({
      where: eq(schema.designerProfiles.userId, designerId),
    });

    if (!profile) {
      const [created] = await this.db
        .insert(schema.designerProfiles)
        .values({ userId: designerId })
        .returning();
      profile = created;
    }

    return {
      fullName: user.fullName,
      email: user.email,
      businessName: user.businessName,
      phone: user.phoneNumber,
      avatar: user.profileImage,
      bio: profile.bio,
      portfolioUrl: profile.portfolioUrl,
      specialties: profile.specialties ?? [],
    };
  }

  async updateProfile(designerId: string, dto: UpdateProfileDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) throw new NotFoundException('Designer not found');

    if (dto.fullName || dto.businessName || dto.phone !== undefined || dto.avatar !== undefined) {
      await this.db
        .update(schema.users)
        .set({
          ...(dto.fullName && { fullName: dto.fullName }),
          ...(dto.businessName !== undefined && { businessName: dto.businessName }),
          ...(dto.phone !== undefined && { phoneNumber: dto.phone }),
          ...(dto.avatar !== undefined && { profileImage: dto.avatar }),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, designerId));
    }

    let profile = await this.db.query.designerProfiles.findFirst({
      where: eq(schema.designerProfiles.userId, designerId),
    });

    if (!profile) {
      const [created] = await this.db
        .insert(schema.designerProfiles)
        .values({ userId: designerId })
        .returning();
      profile = created;
    }

    if (dto.bio !== undefined || dto.portfolioUrl !== undefined || dto.specialties) {
      await this.db
        .update(schema.designerProfiles)
        .set({
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.portfolioUrl !== undefined && { portfolioUrl: dto.portfolioUrl }),
          ...(dto.specialties && { specialties: dto.specialties }),
          updatedAt: new Date(),
        })
        .where(eq(schema.designerProfiles.userId, designerId));
    }

    return this.getProfile(designerId);
  }

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

  async getTasks(designerId: string) {
    return this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.assignedTo, designerId))
      .orderBy(desc(schema.tasks.createdAt));
  }

  async updateTaskStatus(designerId: string, taskId: string, dto: UpdateTaskStatusDto) {
    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assignedTo !== designerId) throw new ForbiddenException('Not your task');

    const [updated] = await this.db
      .update(schema.tasks)
      .set({ status: dto.status as any, updatedAt: new Date() })
      .where(eq(schema.tasks.id, taskId))
      .returning();

    return updated;
  }

  // ---------------------------------------------------------------------------
  // SUBMISSIONS
  // ---------------------------------------------------------------------------

  async getSubmissions(designerId: string) {
    const rows = await this.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.designerId, designerId))
      .orderBy(desc(schema.submissions.updatedAt));

    const submissionIds = rows.map((r) => r.id);
    if (submissionIds.length === 0) return [];

    const fileCounts = await this.db
      .select({
        submissionId: schema.submissionFiles.submissionId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.submissionFiles)
      .where(inArray(schema.submissionFiles.submissionId, submissionIds))
      .groupBy(schema.submissionFiles.submissionId);

    const fileCountMap = new Map(fileCounts.map((f) => [f.submissionId, f.count]));

    return rows.map((r) => ({
      ...r,
      files: fileCountMap.get(r.id) ?? 0,
    }));
  }

  async getSubmissionById(designerId: string, submissionId: string) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.designerId !== designerId) throw new ForbiddenException('Not your submission');

    const files = await this.db
      .select()
      .from(schema.submissionFiles)
      .where(eq(schema.submissionFiles.submissionId, submissionId));

    return { ...sub, files };
  }

  async createSubmission(
    designerId: string,
    dto: CreateSubmissionDto,
    files?: Express.Multer.File[],
  ) {
    const [submission] = await this.db
      .insert(schema.submissions)
      .values({
        title: dto.title,
        category: dto.category ?? 'General Graphics',
        description: dto.description,
        taskId: dto.taskId,
        designerId,
        status: 'draft',
      })
      .returning();

    if (files && files.length > 0) {
      const fileValues = files.map((f) => ({
        submissionId: submission.id,
        originalName: f.originalname,
        storedName: f.filename,
        fileUrl: `/uploads/${f.filename}`,
        mimeType: f.mimetype,
        fileSize: f.size,
      }));
      await this.db.insert(schema.submissionFiles).values(fileValues);
    }

    await this.db.insert(schema.submissionActivities).values({
      submissionId: submission.id,
      type: 'draft',
      title: 'Submission created',
      userId: designerId,
    });

    return submission;
  }

  async updateSubmission(designerId: string, submissionId: string, dto: UpdateSubmissionDto) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.designerId !== designerId) throw new ForbiddenException('Not your submission');
    if (sub.status === 'approved' || sub.status === 'completed') {
      throw new BadRequestException('Cannot edit a locked submission');
    }

    const [updated] = await this.db
      .update(schema.submissions)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId))
      .returning();

    return updated;
  }

  async submitSubmission(designerId: string, submissionId: string) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.designerId !== designerId) throw new ForbiddenException('Not your submission');

    const allowedStatuses = ['draft', 'revision_required'];
    if (!allowedStatuses.includes(sub.status)) {
      throw new BadRequestException(`Cannot submit a ${sub.status} submission`);
    }

    const newStatus = sub.status === 'revision_required' ? 'resubmitted' : 'submitted';

    const [updated] = await this.db
      .update(schema.submissions)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(schema.submissions.id, submissionId))
      .returning();

    await this.db.insert(schema.submissionActivities).values({
      submissionId,
      type: newStatus === 'resubmitted' ? 'submitted' : 'submitted',
      title: newStatus === 'resubmitted' ? 'Resubmitted for review' : 'Submitted for review',
      userId: designerId,
    });

    return updated;
  }

  async getSubmissionActivity(designerId: string, submissionId: string) {
    const sub = await this.db.query.submissions.findFirst({
      where: eq(schema.submissions.id, submissionId),
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.designerId !== designerId) throw new ForbiddenException('Not your submission');

    return this.db
      .select()
      .from(schema.submissionActivities)
      .where(eq(schema.submissionActivities.submissionId, submissionId))
      .orderBy(desc(schema.submissionActivities.createdAt));
  }

  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------

  async getPayments(designerId: string) {
    return this.db
      .select()
      .from(schema.designerPayments)
      .where(eq(schema.designerPayments.designerId, designerId))
      .orderBy(desc(schema.designerPayments.createdAt));
  }

  async getPaymentMethod(designerId: string) {
    const method = await this.db.query.designerPaymentMethods.findFirst({
      where: eq(schema.designerPaymentMethods.designerId, designerId),
    });
    return method ?? null;
  }

  async updatePaymentMethod(designerId: string, dto: UpdatePaymentMethodDto) {
    const existing = await this.db.query.designerPaymentMethods.findFirst({
      where: eq(schema.designerPaymentMethods.designerId, designerId),
    });

    if (existing) {
      const [updated] = await this.db
        .update(schema.designerPaymentMethods)
        .set({ ...dto, updatedAt: new Date() })
        .where(eq(schema.designerPaymentMethods.designerId, designerId))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(schema.designerPaymentMethods)
      .values({ ...dto, designerId })
      .returning();
    return created;
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------

  async getNotifications(designerId: string) {
    return this.db
      .select()
      .from(schema.designerNotifications)
      .where(eq(schema.designerNotifications.designerId, designerId))
      .orderBy(desc(schema.designerNotifications.createdAt));
  }

  async markNotificationRead(designerId: string, notificationId: string) {
    const notif = await this.db.query.designerNotifications.findFirst({
      where: eq(schema.designerNotifications.id, notificationId),
    });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.designerId !== designerId) throw new ForbiddenException('Not your notification');

    await this.db
      .update(schema.designerNotifications)
      .set({ read: true })
      .where(eq(schema.designerNotifications.id, notificationId));

    return { success: true };
  }

  async markAllNotificationsRead(designerId: string) {
    await this.db
      .update(schema.designerNotifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.designerNotifications.designerId, designerId),
          eq(schema.designerNotifications.read, false),
        ),
      );
    return { success: true };
  }

  async getNotificationPreferences(designerId: string) {
    let prefs = await this.db.query.designerNotificationPreferences.findFirst({
      where: eq(schema.designerNotificationPreferences.designerId, designerId),
    });

    if (!prefs) {
      const [created] = await this.db
        .insert(schema.designerNotificationPreferences)
        .values({ designerId })
        .returning();
      prefs = created;
    }

    return prefs;
  }

  async updateNotificationPreferences(designerId: string, dto: UpdateNotificationPrefsDto) {
    const prefs = await this.db.query.designerNotificationPreferences.findFirst({
      where: eq(schema.designerNotificationPreferences.designerId, designerId),
    });

    if (!prefs) {
      const [created] = await this.db
        .insert(schema.designerNotificationPreferences)
        .values({ ...dto, designerId } as any)
        .returning();
      return created;
    }

    const [updated] = await this.db
      .update(schema.designerNotificationPreferences)
      .set({ ...dto, updatedAt: new Date() } as any)
      .where(eq(schema.designerNotificationPreferences.designerId, designerId))
      .returning();

    return updated;
  }

  async createNotification(designerId: string, type: string, title: string, message?: string) {
    const [created] = await this.db
      .insert(schema.designerNotifications)
      .values({ designerId, type: type as any, title, message })
      .returning();
    return created;
  }

  // ---------------------------------------------------------------------------
  // PASSWORD
  // ---------------------------------------------------------------------------

  async changePassword(designerId: string, dto: ChangePasswordDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) throw new NotFoundException('Designer not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.db
      .update(schema.users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(schema.users.id, designerId));

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // IMAGE-TO-CODE
  // ---------------------------------------------------------------------------

  async getImageToCodeConversions(designerId: string) {
    const rows = await this.db
      .select({
        id: schema.imageToCode.id,
        status: schema.imageToCode.status,
        code: schema.imageToCode.code,
        techNotes: schema.imageToCode.techNotes,
        submittedAt: schema.imageToCode.submittedAt,
        reviewerNote: schema.imageToCode.reviewerNote,
        updatedAt: schema.imageToCode.updatedAt,
        submissionId: schema.imageToCode.submissionId,
        submissionTitle: schema.submissions.title,
        submissionCategory: schema.submissions.category,
      })
      .from(schema.imageToCode)
      .innerJoin(schema.submissions, eq(schema.imageToCode.submissionId, schema.submissions.id))
      .where(eq(schema.imageToCode.designerId, designerId))
      .orderBy(desc(schema.imageToCode.updatedAt));

    return rows;
  }

  async updateImageToCode(designerId: string, conversionId: string, dto: UpdateImageToCodeDto) {
    const conv = await this.db.query.imageToCode.findFirst({
      where: eq(schema.imageToCode.id, conversionId),
    });
    if (!conv) throw new NotFoundException('Image-to-code conversion not found');
    if (conv.designerId !== designerId) throw new ForbiddenException('Not your conversion');

    const lockedStatuses = ['accepted', 'submitted'];
    if (lockedStatuses.includes(conv.status)) {
      throw new BadRequestException(`Cannot edit a ${conv.status} conversion`);
    }

    const [updated] = await this.db
      .update(schema.imageToCode)
      .set({ ...dto, status: 'draft' as any, updatedAt: new Date() })
      .where(eq(schema.imageToCode.id, conversionId))
      .returning();

    return updated;
  }

  async submitImageToCode(designerId: string, conversionId: string) {
    const conv = await this.db.query.imageToCode.findFirst({
      where: eq(schema.imageToCode.id, conversionId),
    });
    if (!conv) throw new NotFoundException('Image-to-code conversion not found');
    if (conv.designerId !== designerId) throw new ForbiddenException('Not your conversion');

    const allowedStatuses = ['draft', 'revision_required'];
    if (!allowedStatuses.includes(conv.status)) {
      throw new BadRequestException(`Cannot submit a ${conv.status} conversion`);
    }

    const [updated] = await this.db
      .update(schema.imageToCode)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.imageToCode.id, conversionId))
      .returning();

    return updated;
  }
}
