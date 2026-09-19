import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import { unlinkSync } from 'fs';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CreateDesignerPayoutRequestDto } from './dto/create-designer-payout-request.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { UpdateImageToCodeDto } from './dto/update-image-to-code.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { NotificationsService } from '../notifications/notifications.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DesignerService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

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
        updated: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
      })),
      attentionItems: attentionItems.map((a) => ({
        id: a.id,
        title: a.title,
        reason: 'Revision required',
      })),
      upcomingTasks: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
        priority: t.priority,
      })),
    };
  }

  private getMonthlyEarnings(
    earnings: Array<{ amount: number; status: string; createdAt: Date | string }>,
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
      const cDate = new Date(e.createdAt);
      const key = `${cDate.getFullYear()}-${cDate.getMonth()}`;
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
      cover: profile.coverImage ?? null,
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

    if (
      dto.bio !== undefined ||
      dto.portfolioUrl !== undefined ||
      dto.specialties ||
      dto.cover !== undefined
    ) {
      await this.db
        .update(schema.designerProfiles)
        .set({
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.portfolioUrl !== undefined && { portfolioUrl: dto.portfolioUrl }),
          ...(dto.specialties && { specialties: dto.specialties }),
          ...(dto.cover !== undefined && { coverImage: dto.cover || null }),
          updatedAt: new Date(),
        })
        .where(eq(schema.designerProfiles.userId, designerId));
    }

    return this.getProfile(designerId);
  }

  async uploadAvatar(designerId: string, file?: Express.Multer.File) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) {
      this.discardUpload(file);
      throw new NotFoundException('Designer not found');
    }
    const fileUrl = this.validateDesignerImage(file);
    await this.db
      .update(schema.users)
      .set({ profileImage: fileUrl, updatedAt: new Date() })
      .where(eq(schema.users.id, designerId));
    return this.getProfile(designerId);
  }

  async uploadCover(designerId: string, file?: Express.Multer.File) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, designerId),
    });
    if (!user) {
      this.discardUpload(file);
      throw new NotFoundException('Designer not found');
    }
    const fileUrl = this.validateDesignerImage(file);
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
    await this.db
      .update(schema.designerProfiles)
      .set({ coverImage: fileUrl, updatedAt: new Date() })
      .where(eq(schema.designerProfiles.userId, designerId));
    return this.getProfile(designerId);
  }

  private discardUpload(file?: Express.Multer.File) {
    if (!file) return;
    try {
      unlinkSync(file.path);
    } catch {
      // Ignore cleanup failures.
    }
  }

  private validateDesignerImage(file?: Express.Multer.File): string {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype?.startsWith('image/')) {
      this.discardUpload(file);
      throw new BadRequestException('Only image files (JPG, PNG, WEBP) are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      this.discardUpload(file);
      throw new BadRequestException('Image must be smaller than 5 MB.');
    }
    return `/uploads/${file.filename}`;
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

    // Trigger notification
    try {
      const eventType = dto.status === 'done' ? 'completed' : 'updated';
      await this.notificationsService.triggerTaskEvent({
        taskId: task.id,
        designerId,
        taskTitle: task.title,
        eventType,
        details: `Task status changed to ${dto.status.toUpperCase()}`,
      });
    } catch (err) {
      console.warn('Failed to trigger task status update notification:', err);
    }

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

    const coverRows = await this.db
      .select({
        submissionId: schema.submissionFiles.submissionId,
        fileUrl: schema.submissionFiles.fileUrl,
        mimeType: schema.submissionFiles.mimeType,
      })
      .from(schema.submissionFiles)
      .where(inArray(schema.submissionFiles.submissionId, submissionIds))
      .orderBy(schema.submissionFiles.createdAt);
    const coverMap = new Map<string, string>();
    for (const cr of coverRows) {
      if (!coverMap.has(cr.submissionId) && cr.mimeType?.startsWith('image/')) {
        coverMap.set(cr.submissionId, cr.fileUrl);
      }
    }

    return rows.map((r) => ({
      ...r,
      files: fileCountMap.get(r.id) ?? 0,
      coverFileUrl: coverMap.get(r.id) ?? null,
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

    // Trigger notification
    try {
      await this.notificationsService.triggerSubmissionEvent({
        submissionId: sub.id,
        designerId,
        title: sub.title,
        eventType: 'submitted',
      });
    } catch (err) {
      console.warn('Failed to trigger submission notification:', err);
    }

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
  async getPaymentOverview(designerId: string) {
    let settings = await this.db.query.designerPaymentSettings.findFirst();
    if (!settings) {
      settings = {
        id: 'default',
        perImageAmount: 6000,
        perImageToCodeAmount: 12000,
        payoutSchedule: 'weekly',
        payoutDayOfWeek: 2,
        payoutDayOfMonth: 28,
        manualPayoutFeePercent: 2,
        updatedAt: new Date(),
      } as any;
    }

    const [approvedSubs, acceptedI2c, allPayments, method] = await Promise.all([
      this.db
        .select({ id: schema.submissions.id })
        .from(schema.submissions)
        .where(
          and(
            eq(schema.submissions.designerId, designerId),
            inArray(schema.submissions.status, ['approved', 'completed']),
          ),
        ),
      this.db
        .select({ id: schema.imageToCode.id })
        .from(schema.imageToCode)
        .where(
          and(
            eq(schema.imageToCode.designerId, designerId),
            eq(schema.imageToCode.status, 'accepted'),
          ),
        ),
      this.db
        .select()
        .from(schema.designerPayments)
        .where(eq(schema.designerPayments.designerId, designerId)),
      this.getPaymentMethod(designerId),
    ]);

    let approvedImagesCount = 0;
    if (approvedSubs.length > 0) {
      const subIds = approvedSubs.map((s) => s.id);
      const files = await this.db
        .select({ submissionId: schema.submissionFiles.submissionId })
        .from(schema.submissionFiles)
        .where(inArray(schema.submissionFiles.submissionId, subIds));
      const fileCountMap: Record<string, number> = {};
      for (const f of files) {
        fileCountMap[f.submissionId] = (fileCountMap[f.submissionId] || 0) + 1;
      }
      for (const s of approvedSubs) {
        approvedImagesCount += Math.max(1, fileCountMap[s.id] || 1);
      }
    }

    const acceptedImageToCodeCount = acceptedI2c.length;

    const approvedEarnings =
      approvedImagesCount * settings.perImageAmount +
      acceptedImageToCodeCount * settings.perImageToCodeAmount;

    const paidEarnings = allPayments
      .filter((p) => ['paid', 'successful'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = allPayments
      .filter((p) => ['pending', 'approved', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = Math.max(0, approvedEarnings - paidEarnings);
    const availableBalance = Math.max(0, approvedEarnings - (paidEarnings + pendingPayouts));

    const isTodayGlobalPayout = this.isGlobalPayoutDay(settings);
    const nextScheduled = this.getNextGlobalPayoutDate(settings);

    return {
      approvedImagesCount,
      acceptedImageToCodeCount,
      approvedEarnings,
      paidEarnings,
      pendingPayouts,
      outstandingBalance,
      availableBalance,
      perImageAmount: settings.perImageAmount,
      perImageToCodeAmount: settings.perImageToCodeAmount,
      payoutSchedule: settings.payoutSchedule,
      payoutDayOfWeek: settings.payoutDayOfWeek,
      payoutDayOfMonth: settings.payoutDayOfMonth,
      manualPayoutFeePercent: Number(settings.manualPayoutFeePercent) || 2,
      isTodayGlobalPayout,
      nextScheduledDate: nextScheduled.date,
      nextScheduledDescription: nextScheduled.description,
      hasValidPaymentMethod: Boolean(
        method &&
        method.bankName?.trim() &&
        method.accountNumber?.trim() &&
        method.accountName?.trim(),
      ),
      paymentMethod: method
        ? {
            bankName: method.bankName,
            accountNumber: method.accountNumber,
            accountName: method.accountName,
          }
        : null,
    };
  }

  async requestPayout(designerId: string, dto: CreateDesignerPayoutRequestDto) {
    const method = await this.getPaymentMethod(designerId);
    if (
      !method ||
      !method.bankName?.trim() ||
      !method.accountNumber?.trim() ||
      !method.accountName?.trim()
    ) {
      throw new BadRequestException(
        'You must have valid bank payment information saved before submitting a payout request. Please complete and save your payment details first.',
      );
    }

    const overview = await this.getPaymentOverview(designerId);
    if (overview.availableBalance <= 0) {
      throw new BadRequestException(
        'You do not have eligible approved earnings available to request payment.',
      );
    }

    const requestedAmount = Math.round(Number(dto.amount) || 0);
    if (requestedAmount <= 0) {
      throw new BadRequestException('Payout request amount must be greater than ₦0.');
    }

    if (requestedAmount > overview.availableBalance) {
      throw new BadRequestException(
        `Requested amount of ₦${(requestedAmount / 100).toLocaleString()} exceeds your eligible available balance of ₦${(overview.availableBalance / 100).toLocaleString()}.`,
      );
    }

    const isScheduledDay = overview.isTodayGlobalPayout;
    const isManual = dto.payoutType === 'manual' || (!dto.payoutType && !isScheduledDay);

    let fee = 0;
    if (isManual && !isScheduledDay) {
      const feePercent = Number(overview.manualPayoutFeePercent) || 2;
      fee = Math.round(requestedAmount * (feePercent / 100));
    }
    const netAmount = Math.max(0, requestedAmount - fee);

    const refDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `PAY-${refDate}-${randPart}`;

    const [created] = await this.db
      .insert(schema.designerPayments)
      .values({
        designerId,
        amount: requestedAmount,
        status: 'pending',
        period: `Requested ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        reference,
        payoutType: isManual ? 'manual' : 'global',
        fee,
        netAmount,
        relatedWork: 'Approved earnings payout request',
        notes: dto.notes || undefined,
        bankName: method.bankName,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
      })
      .returning();

    try {
      await this.notificationsService.triggerDesignerPaymentEvent({
        paymentId: created.id,
        designerId,
        amount: netAmount,
        reference,
        status: 'pending',
        notes: dto.notes,
      });
    } catch (err) {
      console.warn('Could not dispatch payment notification for payout request:', err);
    }

    return created;
  }

  private isGlobalPayoutDay(settings: schema.DesignerPaymentSettings, date = new Date()): boolean {
    if (settings.payoutSchedule === 'weekly') {
      const jsDay = date.getDay(); // 0 Sunday, 1 Monday, 2 Tuesday, ...
      const configuredDay = Number(settings.payoutDayOfWeek) ?? 2;
      return jsDay === configuredDay;
    } else {
      const dayOfMonth = date.getDate();
      const configuredDom = Number(settings.payoutDayOfMonth) ?? 28;
      return dayOfMonth === configuredDom;
    }
  }

  private getNextGlobalPayoutDate(settings: schema.DesignerPaymentSettings): {
    date: string;
    description: string;
  } {
    const now = new Date();
    if (settings.payoutSchedule === 'weekly') {
      const targetDay = Number(settings.payoutDayOfWeek) ?? 2; // Default Tuesday
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const next = new Date(now);
      next.setDate(now.getDate() + diff);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        date: next.toISOString(),
        description: `Every ${days[targetDay]}`,
      };
    } else {
      const targetDom = Number(settings.payoutDayOfMonth) ?? 28;
      const next = new Date(now.getFullYear(), now.getMonth(), targetDom);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      return {
        date: next.toISOString(),
        description: `${targetDom}th of each month`,
      };
    }
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
    // Idempotent mint: ensure every approved/completed submission has a conversion row.
    // Covers historical approvals that predate auto-creation on review.
    const approvedSubs = await this.db
      .select({ id: schema.submissions.id })
      .from(schema.submissions)
      .where(
        and(
          eq(schema.submissions.designerId, designerId),
          inArray(schema.submissions.status, ['approved', 'completed'] as any),
        ),
      );

    if (approvedSubs.length > 0) {
      const existing = await this.db
        .select({ submissionId: schema.imageToCode.submissionId })
        .from(schema.imageToCode)
        .where(eq(schema.imageToCode.designerId, designerId));
      const have = new Set(existing.map((r) => r.submissionId));
      const missing = approvedSubs.filter((s) => !have.has(s.id));
      for (const s of missing) {
        await this.db
          .insert(schema.imageToCode)
          .values({ designerId, submissionId: s.id, status: 'not_started' as any })
          .onConflictDoNothing({ target: schema.imageToCode.submissionId });
      }
    }

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

    if (rows.length > 0) {
      const submissionIds = rows.map((r) => r.submissionId);
      const coverRows = await this.db
        .select({
          submissionId: schema.submissionFiles.submissionId,
          fileUrl: schema.submissionFiles.fileUrl,
          mimeType: schema.submissionFiles.mimeType,
        })
        .from(schema.submissionFiles)
        .where(inArray(schema.submissionFiles.submissionId, submissionIds))
        .orderBy(schema.submissionFiles.createdAt);
      const coverMap = new Map<string, string>();
      for (const cr of coverRows) {
        if (!coverMap.has(cr.submissionId) && cr.mimeType?.startsWith('image/')) {
          coverMap.set(cr.submissionId, cr.fileUrl);
        }
      }
      return rows.map((r) => ({
        ...r,
        coverFileUrl: coverMap.get(r.submissionId) ?? null,
      }));
    }

    return rows.map((r) => ({ ...r, coverFileUrl: null }));
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
