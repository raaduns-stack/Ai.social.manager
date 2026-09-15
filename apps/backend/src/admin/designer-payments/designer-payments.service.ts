import { Inject, Injectable, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc, sql, or, ilike } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { UpdateDesignerPaymentSettingsDto } from './dto/update-designer-payment-settings.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { NotificationsService } from '../../notifications/notifications.service';

type Database = PostgresJsDatabase<typeof schema>;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class DesignerPaymentsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  async getSettings() {
    let settings = await this.db.query.designerPaymentSettings.findFirst();
    if (!settings) {
      const [created] = await this.db
        .insert(schema.designerPaymentSettings)
        .values({
          perImageAmount: 500000, // ₦5,000
          perImageToCodeAmount: 1000000, // ₦10,000
          payoutSchedule: 'weekly',
          payoutDayOfWeek: 2, // Tuesday
          payoutDayOfMonth: 28,
          manualPayoutFeePercent: 2,
        })
        .returning();
      settings = created;
    }
    return settings;
  }

  async updateSettings(dto: UpdateDesignerPaymentSettingsDto) {
    const settings = await this.getSettings();

    const [updated] = await this.db
      .update(schema.designerPaymentSettings)
      .set({
        ...dto,
        manualPayoutFeePercent: dto.manualPayoutFeePercent ?? settings.manualPayoutFeePercent,
        updatedAt: new Date(),
      })
      .where(eq(schema.designerPaymentSettings.id, settings.id))
      .returning();

    return updated;
  }

  isGlobalPayoutDay(settings: schema.DesignerPaymentSettings, date = new Date()): boolean {
    if (settings.payoutSchedule === 'weekly') {
      const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;
      return dayOfWeek === settings.payoutDayOfWeek;
    } else {
      return date.getDate() === settings.payoutDayOfMonth;
    }
  }

  getNextGlobalPayoutDate(settings: schema.DesignerPaymentSettings): { date: string; description: string } {
    const now = new Date();
    const next = new Date(now);

    if (settings.payoutSchedule === 'weekly') {
      const jsDay = now.getDay();
      const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;
      const targetDay = settings.payoutDayOfWeek; // 1..7

      let diff = targetDay - currentDayOfWeek;
      if (diff < 0) {
        diff += 7;
      } else if (diff === 0) {
        // Today is payout day
        diff = 0;
      }
      next.setDate(now.getDate() + diff);

      const dayName = targetDay === 7 ? 'Sunday' : DAY_NAMES[targetDay] || 'Tuesday';
      return {
        date: next.toISOString().slice(0, 10),
        description: `Weekly (Every ${dayName})`,
      };
    } else {
      const targetDay = settings.payoutDayOfMonth;
      if (now.getDate() > targetDay) {
        next.setMonth(now.getMonth() + 1);
      }
      next.setDate(Math.min(targetDay, 28));
      return {
        date: next.toISOString().slice(0, 10),
        description: `Monthly (${targetDay}th of each month)`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // DESIGNER EARNINGS (PER DESIGNER)
  // ---------------------------------------------------------------------------

  async getDesignerEarnings() {
    const settings = await this.getSettings();

    // 1. Get all designer users
    const designers = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        profileImage: schema.users.profileImage,
        phoneNumber: schema.users.phoneNumber,
        accountStatus: schema.users.accountStatus,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'designer'))
      .orderBy(schema.users.fullName);

    if (designers.length === 0) {
      return [];
    }

    const designerIds = designers.map((d) => d.id);

    // 2. Fetch all submissions with file counts for these designers
    const allSubmissions = await this.db
      .select({
        id: schema.submissions.id,
        designerId: schema.submissions.designerId,
        status: schema.submissions.status,
      })
      .from(schema.submissions)
      .where(inArray(schema.submissions.designerId, designerIds));

    const submissionIds = allSubmissions.map((s) => s.id);

    let fileCountMap: Record<string, number> = {};
    if (submissionIds.length > 0) {
      const filesCounts = await this.db
        .select({
          submissionId: schema.submissionFiles.submissionId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.submissionFiles)
        .where(inArray(schema.submissionFiles.submissionId, submissionIds))
        .groupBy(schema.submissionFiles.submissionId);

      for (const fc of filesCounts) {
        fileCountMap[fc.submissionId] = fc.count;
      }
    }

    // 3. Fetch image-to-code conversions
    const allImageToCode = await this.db
      .select({
        id: schema.imageToCode.id,
        designerId: schema.imageToCode.designerId,
        status: schema.imageToCode.status,
      })
      .from(schema.imageToCode)
      .where(inArray(schema.imageToCode.designerId, designerIds));

    // 4. Fetch designer payments
    const allPayments = await this.db
      .select({
        id: schema.designerPayments.id,
        designerId: schema.designerPayments.designerId,
        amount: schema.designerPayments.amount,
        status: schema.designerPayments.status,
        fee: schema.designerPayments.fee,
        netAmount: schema.designerPayments.netAmount,
      })
      .from(schema.designerPayments)
      .where(inArray(schema.designerPayments.designerId, designerIds));

    // 5. Fetch default payment methods
    const paymentMethods = await this.db
      .select()
      .from(schema.designerPaymentMethods)
      .where(inArray(schema.designerPaymentMethods.designerId, designerIds));

    const methodMap = new Map(paymentMethods.map((m) => [m.designerId, m]));

    // Aggregate results per designer
    const results = designers.map((designer) => {
      const designerSubs = allSubmissions.filter((s) => s.designerId === designer.id);
      const designerI2c = allImageToCode.filter((i) => i.designerId === designer.id);
      const designerPays = allPayments.filter((p) => p.designerId === designer.id);

      // Approved design work
      let approvedImagesCount = 0;
      let pendingImagesCount = 0;

      for (const s of designerSubs) {
        const fileCount = fileCountMap[s.id] ?? 0;
        if (['approved', 'completed'].includes(s.status)) {
          approvedImagesCount += fileCount;
        } else if (['submitted', 'received', 'under_review', 'resubmitted'].includes(s.status)) {
          pendingImagesCount += fileCount;
        }
      }

      // Approved image-to-code
      const acceptedImageToCodeCount = designerI2c.filter((i) => i.status === 'accepted').length;
      const pendingImageToCodeCount = designerI2c.filter((i) => i.status === 'submitted').length;

      // Earnings calculations based on database global settings
      const approvedEarnings =
        approvedImagesCount * settings.perImageAmount +
        acceptedImageToCodeCount * settings.perImageToCodeAmount;

      const pendingEarnings =
        pendingImagesCount * settings.perImageAmount +
        pendingImageToCodeCount * settings.perImageToCodeAmount;

      // Payments made
      const paidEarnings = designerPays
        .filter((p) => ['paid', 'successful'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayouts = designerPays
        .filter((p) => ['pending', 'approved', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const outstandingBalance = Math.max(0, approvedEarnings - paidEarnings);

      const defaultMethod = methodMap.get(designer.id);

      return {
        designerId: designer.id,
        fullName: designer.fullName,
        email: designer.email,
        profileImage: designer.profileImage,
        phoneNumber: designer.phoneNumber,
        accountStatus: designer.accountStatus,
        createdAt: designer.createdAt,

        approvedImagesCount,
        acceptedImageToCodeCount,
        pendingImagesCount,
        pendingImageToCodeCount,

        approvedEarnings,
        pendingEarnings,
        totalEarnings: approvedEarnings,
        paidEarnings,
        pendingPayouts,
        outstandingBalance,

        paymentMethod: defaultMethod
          ? {
              bankName: defaultMethod.bankName,
              accountNumber: defaultMethod.accountNumber,
              accountName: defaultMethod.accountName,
            }
          : null,
      };
    });

    return results;
  }

  // ---------------------------------------------------------------------------
  // PAYMENT DASHBOARD STATS
  // ---------------------------------------------------------------------------

  async getDashboardStats() {
    const settings = await this.getSettings();
    const earningsList = await this.getDesignerEarnings();

    // 1. Total designer earnings = sum of approved earnings across all designers
    const totalDesignerEarnings = earningsList.reduce((sum, d) => sum + d.approvedEarnings, 0);

    // 2. Query all designer payments for exact aggregates
    const payments = await this.db.select().from(schema.designerPayments);

    let pendingPayments = 0;
    let processedPayments = 0;
    let pendingCount = 0;
    let processedCount = 0;

    for (const p of payments) {
      if (p.status === 'pending') {
        pendingPayments += p.amount;
        pendingCount++;
      } else if (['paid', 'successful'].includes(p.status)) {
        processedPayments += p.amount;
        processedCount++;
      }
    }

    // 3. Outstanding payments = total designer approved earnings minus total processed payments
    const outstandingPayments = Math.max(0, totalDesignerEarnings - processedPayments);

    // 4. Schedule information
    const scheduleInfo = this.getNextGlobalPayoutDate(settings);
    const isTodayGlobalPayout = this.isGlobalPayoutDay(settings);

    return {
      totalDesignerEarnings,
      pendingPayments,
      processedPayments,
      outstandingPayments,

      totalDesigners: earningsList.length,
      pendingPayoutsCount: pendingCount,
      processedPayoutsCount: processedCount,
      totalPayoutRecordsCount: payments.length,

      settings: {
        perImageAmount: settings.perImageAmount,
        perImageToCodeAmount: settings.perImageToCodeAmount,
        payoutSchedule: settings.payoutSchedule,
        payoutDayOfWeek: settings.payoutDayOfWeek,
        payoutDayOfMonth: settings.payoutDayOfMonth,
        manualPayoutFeePercent: settings.manualPayoutFeePercent,
      },

      schedule: {
        description: scheduleInfo.description,
        nextDate: scheduleInfo.date,
        isTodayGlobalPayout,
        feeNotice: `Global payouts have 0% fee. Manual payouts before ${scheduleInfo.description} incur a ${settings.manualPayoutFeePercent}% charge.`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // PAYMENT RECORDS (LIST, FILTER, PROCESS, CREATE)
  // ---------------------------------------------------------------------------

  async getPaymentRecords(filters?: {
    status?: string;
    search?: string;
    designerId?: string;
  }) {
    const conditions = [];

    if (filters?.designerId) {
      conditions.push(eq(schema.designerPayments.designerId, filters.designerId));
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'successful') {
        conditions.push(
          or(
            eq(schema.designerPayments.status, 'successful'),
            eq(schema.designerPayments.status, 'paid'),
          ),
        );
      } else {
        conditions.push(eq(schema.designerPayments.status, filters.status as any));
      }
    }

    const baseQuery = this.db
      .select({
        id: schema.designerPayments.id,
        designerId: schema.designerPayments.designerId,
        amount: schema.designerPayments.amount,
        status: schema.designerPayments.status,
        period: schema.designerPayments.period,
        reference: schema.designerPayments.reference,
        payoutType: schema.designerPayments.payoutType,
        fee: schema.designerPayments.fee,
        netAmount: schema.designerPayments.netAmount,
        relatedWork: schema.designerPayments.relatedWork,
        notes: schema.designerPayments.notes,
        bankName: schema.designerPayments.bankName,
        accountNumber: schema.designerPayments.accountNumber,
        accountName: schema.designerPayments.accountName,
        paidAt: schema.designerPayments.paidAt,
        createdAt: schema.designerPayments.createdAt,
        updatedAt: schema.designerPayments.updatedAt,
        designerName: schema.users.fullName,
        designerEmail: schema.users.email,
        designerProfileImage: schema.users.profileImage,
      })
      .from(schema.designerPayments)
      .innerJoin(schema.users, eq(schema.designerPayments.designerId, schema.users.id))
      .orderBy(desc(schema.designerPayments.createdAt));

    let rows;
    if (conditions.length > 0) {
      rows = await baseQuery.where(and(...conditions));
    } else {
      rows = await baseQuery;
    }

    // Client/search query matching
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.designerName?.toLowerCase().includes(q) ||
          r.designerEmail?.toLowerCase().includes(q) ||
          r.reference?.toLowerCase().includes(q) ||
          r.period?.toLowerCase().includes(q) ||
          r.bankName?.toLowerCase().includes(q) ||
          r.accountNumber?.includes(q),
      );
    }

    return rows.map((r) => ({
      ...r,
      // Ensure netAmount is computed if null on older rows
      netAmount: r.netAmount ?? Math.max(0, r.amount - (r.fee || 0)),
      reference: r.reference || `PAY-${r.id.slice(0, 8).toUpperCase()}`,
    }));
  }

  async createPayout(dto: CreatePayoutDto, adminUserId?: string) {
    const designer = await this.db.query.users.findFirst({
      where: eq(schema.users.id, dto.designerId),
    });
    if (!designer) throw new NotFoundException('Designer not found');

    const settings = await this.getSettings();

    // Determine bank details: use DTO or designer's default method
    let bankName = dto.bankName;
    let accountNumber = dto.accountNumber;
    let accountName = dto.accountName;

    if (!bankName || !accountNumber) {
      const defaultMethod = await this.db.query.designerPaymentMethods.findFirst({
        where: eq(schema.designerPaymentMethods.designerId, dto.designerId),
      });
      if (defaultMethod) {
        bankName = bankName || defaultMethod.bankName;
        accountNumber = accountNumber || defaultMethod.accountNumber;
        accountName = accountName || defaultMethod.accountName;
      }
    }

    // Determine fee logic:
    // Global payouts have NO charge (0%).
    // Manual payouts requested before global payout day have 2% charge (settings.manualPayoutFeePercent).
    // Manual payouts requested ON global payout day have NO charge (0%).
    const isGlobalPayoutDay = this.isGlobalPayoutDay(settings);
    const amount = Math.round(Number(dto.amount) || 0);
    let fee = 0;
    if (dto.payoutType === 'manual' && !isGlobalPayoutDay) {
      const feePercent = Number(settings.manualPayoutFeePercent) || 2;
      fee = Math.round(amount * (feePercent / 100));
    }
    const netAmount = Math.max(0, amount - fee);

    // Generate readable reference
    const refDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `PAY-${refDate}-${randPart}`;

    const [created] = await this.db
      .insert(schema.designerPayments)
      .values({
        designerId: dto.designerId,
        amount,
        status: 'pending',
        period: dto.period || `Payout ${new Date().toLocaleDateString()}`,
        reference,
        payoutType: dto.payoutType,
        fee,
        netAmount,
        relatedWork: dto.relatedWork || 'Approved design work balance',
        notes: dto.notes,
        bankName: bankName || 'Bank Transfer',
        accountNumber: accountNumber || '',
        accountName: accountName || designer.fullName,
      })
      .returning();

    // Send notification to designer and record in admin notification history
    try {
      await this.notificationsService.triggerDesignerPaymentEvent({
        paymentId: created.id,
        designerId: dto.designerId,
        amount: netAmount,
        reference,
        status: 'pending',
        senderId: adminUserId,
        notes: dto.notes,
      });
    } catch (err) {
      console.warn('Could not dispatch payment notification for payout:', err);
    }

    return created;
  }

  async updatePaymentStatus(id: string, dto: UpdatePayoutStatusDto, adminUserId?: string) {
    const payment = await this.db.query.designerPayments.findFirst({
      where: eq(schema.designerPayments.id, id),
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const updates: Partial<schema.NewDesignerPayment> = {
      status: dto.status as any,
      updatedAt: new Date(),
    };

    if (dto.notes) {
      updates.notes = dto.notes;
    }

    if (dto.status === 'successful' || dto.status === 'paid') {
      updates.paidAt = new Date();
    }

    const [updated] = await this.db
      .update(schema.designerPayments)
      .set(updates)
      .where(eq(schema.designerPayments.id, id))
      .returning();

    // Send designer notification and record in admin notification history
    try {
      const mappedStatus: 'pending' | 'approved' | 'processing' | 'successful' | 'failed' | 'declined' =
        dto.status === 'paid' ? 'successful' : (dto.status as any);

      await this.notificationsService.triggerDesignerPaymentEvent({
        paymentId: payment.id,
        designerId: payment.designerId,
        amount: payment.netAmount || payment.amount,
        reference: payment.reference || `PAY-${payment.id.slice(0, 8)}`,
        status: mappedStatus,
        senderId: adminUserId,
        notes: dto.notes,
      });
    } catch (err) {
      console.warn('Could not dispatch designer payment notification:', err);
    }

    return updated;
  }

  async deletePaymentRecord(id: string) {
    const payment = await this.db.query.designerPayments.findFirst({
      where: eq(schema.designerPayments.id, id),
    });

    if (!payment) {
      throw new NotFoundException(`Designer payment record with ID "${id}" not found`);
    }

    await this.db.delete(schema.designerPayments).where(eq(schema.designerPayments.id, id));
    return { success: true, message: 'Payment record deleted successfully' };
  }
}
