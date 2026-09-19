import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc, sql, gte, lte, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { DesignReportsQueryDto } from './dto/design-reports-query.dto';

type Database = PostgresJsDatabase<typeof schema>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class DesignReportsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  // ---------------------------------------------------------------------------
  // Date Range Helper
  // ---------------------------------------------------------------------------
  private getDateBounds(query: DesignReportsQueryDto): { start?: Date; end?: Date } {
    let start: Date | undefined;
    let end: Date | undefined;

    if (query.startDate && !isNaN(new Date(query.startDate).getTime())) {
      start = new Date(query.startDate);
    }
    if (query.endDate && !isNaN(new Date(query.endDate).getTime())) {
      end = new Date(query.endDate);
    }

    if (!start && query.timeframe && query.timeframe !== 'all') {
      const now = new Date();
      switch (query.timeframe) {
        case 'today': {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        }
        case '7d': {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case '30d': {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        }
        case 'this_month': {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        }
        case 'last_month': {
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        }
        case 'this_year': {
          start = new Date(now.getFullYear(), 0, 1);
          break;
        }
      }
    }

    return { start, end };
  }

  // ---------------------------------------------------------------------------
  // 1. DESIGN PERFORMANCE REPORTS
  // ---------------------------------------------------------------------------
  async getDesignPerformance(query: DesignReportsQueryDto) {
    const { start, end } = this.getDateBounds(query);

    const conditions = [];
    if (start) conditions.push(gte(schema.submissions.createdAt, start));
    if (end) conditions.push(lte(schema.submissions.createdAt, end));
    if (query.designerId && UUID_REGEX.test(query.designerId)) {
      conditions.push(eq(schema.submissions.designerId, query.designerId));
    }
    if (query.category && query.category !== 'all') {
      conditions.push(eq(schema.submissions.category, query.category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allSubmissions = await this.db.query.submissions.findMany({
      where: whereClause,
      with: {
        designer: {
          columns: { id: true, fullName: true, email: true },
        },
        files: true,
        activities: true,
      },
      orderBy: [desc(schema.submissions.createdAt)],
    });

    const totalSubmissions = allSubmissions.length;
    let completedCount = 0;
    let approvedCount = 0;
    let revisionCount = 0;
    let pendingReviewsCount = 0;
    let draftCount = 0;

    const categoryMap: Record<
      string,
      { total: number; approved: number; pending: number; revisions: number }
    > = {};

    for (const sub of allSubmissions) {
      const st = sub.status;
      if (st === 'completed') completedCount++;
      if (st === 'approved') approvedCount++;
      if (st === 'revision_required') revisionCount++;
      if (['submitted', 'received', 'under_review', 'resubmitted'].includes(st))
        pendingReviewsCount++;
      if (st === 'draft') draftCount++;

      const cat = sub.category || 'General Graphics';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, approved: 0, pending: 0, revisions: 0 };
      }
      categoryMap[cat].total++;
      if (['approved', 'completed'].includes(st)) categoryMap[cat].approved++;
      else if (['submitted', 'received', 'under_review', 'resubmitted'].includes(st))
        categoryMap[cat].pending++;
      else if (st === 'revision_required') categoryMap[cat].revisions++;
    }

    // Rejection count from activities or rejected statuses
    const rejectedActivities = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.submissionActivities)
      .where(
        sql`lower(${schema.submissionActivities.type}) like '%reject%' or lower(${schema.submissionActivities.title}) like '%reject%'`,
      );

    const rejectionCount = Number(rejectedActivities[0]?.count || 0);

    const categoriesList = Object.entries(categoryMap)
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        approved: stats.approved,
        pending: stats.pending,
        revisions: stats.revisions,
        percentage: totalSubmissions > 0 ? Math.round((stats.total / totalSubmissions) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Timeline trend (grouped by date)
    const trendMap: Record<
      string,
      { date: string; submitted: number; approved: number; revisions: number }
    > = {};
    for (const sub of allSubmissions) {
      const dateKey = sub.createdAt ? sub.createdAt.toISOString().slice(0, 10) : 'unknown';
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, submitted: 0, approved: 0, revisions: 0 };
      }
      trendMap[dateKey].submitted++;
      if (['approved', 'completed'].includes(sub.status)) {
        trendMap[dateKey].approved++;
      }
      if (sub.status === 'revision_required') {
        trendMap[dateKey].revisions++;
      }
    }

    const timeline = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalApprovedOrCompleted = approvedCount + completedCount;
    const approvalRate =
      totalSubmissions > 0 ? Math.round((totalApprovedOrCompleted / totalSubmissions) * 100) : 0;
    const revisionRate =
      totalSubmissions > 0 ? Math.round((revisionCount / totalSubmissions) * 100) : 0;

    return {
      summary: {
        totalSubmissions,
        completed: completedCount,
        approved: approvedCount,
        totalApproved: totalApprovedOrCompleted,
        pendingReviews: pendingReviewsCount,
        revisions: revisionCount,
        rejected: rejectionCount,
        drafts: draftCount,
        approvalRate,
        revisionRate,
      },
      categories: categoriesList,
      timeline,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. DESIGNER PERFORMANCE REPORTS
  // ---------------------------------------------------------------------------
  async getDesignerPerformance(query: DesignReportsQueryDto) {
    const { start, end } = this.getDateBounds(query);

    // Get settings for earnings computation
    const settings = await this.db.query.designerPaymentSettings.findFirst();
    const perImageAmount = settings?.perImageAmount || 500000; // ₦5,000
    const perImageToCodeAmount = settings?.perImageToCodeAmount || 1000000; // ₦10,000

    // Fetch designers
    const designerConditions = [eq(schema.users.role, 'designer')];
    if (query.designerId && UUID_REGEX.test(query.designerId)) {
      designerConditions.push(eq(schema.users.id, query.designerId));
    }

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
      .where(and(...designerConditions))
      .orderBy(schema.users.fullName);

    if (designers.length === 0) {
      return {
        designers: [],
        totals: { totalDesigners: 0, totalAssigned: 0, totalCompleted: 0, totalEarned: 0 },
      };
    }

    const designerIds = designers.map((d) => d.id);

    // 1. Fetch tasks
    const taskConditions = [inArray(schema.tasks.assignedTo, designerIds)];
    if (start) taskConditions.push(gte(schema.tasks.createdAt, start));
    if (end) taskConditions.push(lte(schema.tasks.createdAt, end));

    const tasksList = await this.db.query.tasks.findMany({
      where: and(...taskConditions),
    });

    // 2. Fetch submissions
    const subConditions = [inArray(schema.submissions.designerId, designerIds)];
    if (start) subConditions.push(gte(schema.submissions.createdAt, start));
    if (end) subConditions.push(lte(schema.submissions.createdAt, end));

    const submissionsList = await this.db.query.submissions.findMany({
      where: and(...subConditions),
      with: { files: true },
    });

    // 3. Fetch image-to-code
    const i2cConditions = [inArray(schema.imageToCode.designerId, designerIds)];
    if (start) i2cConditions.push(gte(schema.imageToCode.createdAt, start));
    if (end) i2cConditions.push(lte(schema.imageToCode.createdAt, end));

    const imageToCodeList = await this.db.query.imageToCode.findMany({
      where: and(...i2cConditions),
    });

    // 4. Fetch designer payments
    const paymentsList = await this.db.query.designerPayments.findMany({
      where: inArray(schema.designerPayments.designerId, designerIds),
    });

    // Aggregate per designer
    const results = designers.map((designer) => {
      const dTasks = tasksList.filter((t) => t.assignedTo === designer.id);
      const dSubs = submissionsList.filter((s) => s.designerId === designer.id);
      const dI2c = imageToCodeList.filter((i) => i.designerId === designer.id);
      const dPayments = paymentsList.filter((p) => p.designerId === designer.id);

      const assignmentsCount = dTasks.length;
      const submissionsCount = dSubs.length;

      let approvedCount = 0;
      let completedCount = 0;
      let revisionCount = 0;
      let pendingCount = 0;
      let approvedImagesCount = 0;

      for (const s of dSubs) {
        const fileCount = s.files?.length || 1;
        if (s.status === 'completed') {
          completedCount++;
          approvedImagesCount += fileCount;
        } else if (s.status === 'approved') {
          approvedCount++;
          approvedImagesCount += fileCount;
        } else if (s.status === 'revision_required') {
          revisionCount++;
        } else if (['submitted', 'received', 'under_review', 'resubmitted'].includes(s.status)) {
          pendingCount++;
        }
      }

      const acceptedI2cCount = dI2c.filter((i) => i.status === 'accepted').length;

      // Workload: active open/in_progress tasks + pending/review submissions
      const activeTasks = dTasks.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
      const currentWorkload = activeTasks + pendingCount + revisionCount;

      // Earnings
      const totalEarned =
        approvedImagesCount * perImageAmount + acceptedI2cCount * perImageToCodeAmount;
      const paidEarnings = dPayments
        .filter((p) => ['paid', 'successful'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayouts = dPayments
        .filter((p) => ['pending', 'approved', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const outstandingBalance = Math.max(0, totalEarned - paidEarnings);

      const totalApprovedWork = approvedCount + completedCount;
      const approvalRate =
        submissionsCount > 0 ? Math.round((totalApprovedWork / submissionsCount) * 100) : 0;
      const completionRate =
        assignmentsCount > 0 ? Math.round((totalApprovedWork / assignmentsCount) * 100) : 0;

      return {
        designerId: designer.id,
        fullName: designer.fullName,
        email: designer.email,
        profileImage: designer.profileImage,
        phoneNumber: designer.phoneNumber,
        accountStatus: designer.accountStatus,
        assignmentsCount,
        submissionsCount,
        completedCount: totalApprovedWork,
        approvedCount,
        revisionCount,
        rejectionCount: 0,
        pendingCount,
        currentWorkload,
        approvedImagesCount,
        acceptedI2cCount,
        approvalRate,
        completionRate,
        totalEarned,
        paidEarnings,
        pendingPayouts,
        outstandingBalance,
      };
    });

    const totals = {
      totalDesigners: designers.length,
      totalAssigned: results.reduce((s, d) => s + d.assignmentsCount, 0),
      totalSubmissions: results.reduce((s, d) => s + d.submissionsCount, 0),
      totalCompleted: results.reduce((s, d) => s + d.completedCount, 0),
      totalWorkload: results.reduce((s, d) => s + d.currentWorkload, 0),
      totalEarned: results.reduce((s, d) => s + d.totalEarned, 0),
      totalPaid: results.reduce((s, d) => s + d.paidEarnings, 0),
      totalOutstanding: results.reduce((s, d) => s + d.outstandingBalance, 0),
    };

    return { designers: results, totals };
  }

  // ---------------------------------------------------------------------------
  // 3. STAFF PERFORMANCE REPORTS
  // ---------------------------------------------------------------------------
  async getStaffPerformance(query: DesignReportsQueryDto) {
    const { start, end } = this.getDateBounds(query);

    // 1. Get all staff users
    const staffConditions = [
      inArray(schema.users.role, ['super_admin', 'reviewer', 'account_manager', 'support_staff']),
    ];
    if (query.staffId && UUID_REGEX.test(query.staffId)) {
      staffConditions.push(eq(schema.users.id, query.staffId));
    }

    const staffUsers = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.role,
        profileImage: schema.users.profileImage,
      })
      .from(schema.users)
      .where(and(...staffConditions))
      .orderBy(schema.users.fullName);

    const staffIds = staffUsers.map((s) => s.id);

    // 2. Fetch tasks created/assigned by staff
    const taskConditions = [];
    if (staffIds.length > 0) taskConditions.push(inArray(schema.tasks.assignedBy, staffIds));
    if (start) taskConditions.push(gte(schema.tasks.createdAt, start));
    if (end) taskConditions.push(lte(schema.tasks.createdAt, end));

    const tasksAssigned = await this.db.query.tasks.findMany({
      where: taskConditions.length > 0 ? and(...taskConditions) : undefined,
    });

    // 3. Fetch submission activities conducted by staff
    const activityConditions = [];
    if (staffIds.length > 0)
      activityConditions.push(inArray(schema.submissionActivities.userId, staffIds));
    if (start) activityConditions.push(gte(schema.submissionActivities.createdAt, start));
    if (end) activityConditions.push(lte(schema.submissionActivities.createdAt, end));

    const activities = await this.db.query.submissionActivities.findMany({
      where: activityConditions.length > 0 ? and(...activityConditions) : undefined,
      orderBy: [desc(schema.submissionActivities.createdAt)],
    });

    const staffMetrics = staffUsers.map((staff) => {
      const sTasks = tasksAssigned.filter((t) => t.assignedBy === staff.id);
      const sActivities = activities.filter((a) => a.userId === staff.id);

      let approvalsCount = 0;
      let revisionsRequested = 0;
      let reviewsCount = 0;

      for (const a of sActivities) {
        const t = (a.type || '').toLowerCase();
        const title = (a.title || '').toLowerCase();
        if (t.includes('approv') || title.includes('approv')) approvalsCount++;
        else if (t.includes('revis') || title.includes('revis')) revisionsRequested++;
        else if (t.includes('review') || title.includes('review') || t.includes('submit'))
          reviewsCount++;
      }

      const totalActions = sTasks.length + sActivities.length;

      return {
        staffId: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        profileImage: staff.profileImage,
        tasksAssignedCount: sTasks.length,
        reviewsConductedCount: reviewsCount,
        approvalsGivenCount: approvalsCount,
        revisionsRequestedCount: revisionsRequested,
        totalActions,
        recentActivities: sActivities.slice(0, 5).map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          createdAt: a.createdAt,
        })),
      };
    });

    return {
      staff: staffMetrics,
      totals: {
        totalStaff: staffUsers.length,
        totalTasksAssigned: tasksAssigned.length,
        totalActivities: activities.length,
        totalApprovals: staffMetrics.reduce((s, m) => s + m.approvalsGivenCount, 0),
        totalRevisions: staffMetrics.reduce((s, m) => s + m.revisionsRequestedCount, 0),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. PAYMENT & EARNINGS REPORTS
  // ---------------------------------------------------------------------------
  async getPaymentEarnings(query: DesignReportsQueryDto) {
    const { start, end } = this.getDateBounds(query);

    // Fetch payment settings
    const settings = await this.db.query.designerPaymentSettings.findFirst();
    const perImageAmount = settings?.perImageAmount || 500000;
    const perImageToCodeAmount = settings?.perImageToCodeAmount || 1000000;

    // Fetch payments with filters
    const paymentConditions = [];
    if (query.designerId && UUID_REGEX.test(query.designerId)) {
      paymentConditions.push(eq(schema.designerPayments.designerId, query.designerId));
    }
    if (start) paymentConditions.push(gte(schema.designerPayments.createdAt, start));
    if (end) paymentConditions.push(lte(schema.designerPayments.createdAt, end));

    const payments = await this.db.query.designerPayments.findMany({
      where: paymentConditions.length > 0 ? and(...paymentConditions) : undefined,
      with: {
        designer: {
          columns: { id: true, fullName: true, email: true, profileImage: true },
        },
      },
      orderBy: [desc(schema.designerPayments.createdAt)],
    });

    // Payout Status Distribution
    const statusCounts: Record<
      string,
      { count: number; amount: number; netAmount: number; fee: number }
    > = {
      pending: { count: 0, amount: 0, netAmount: 0, fee: 0 },
      approved: { count: 0, amount: 0, netAmount: 0, fee: 0 },
      processing: { count: 0, amount: 0, netAmount: 0, fee: 0 },
      successful: { count: 0, amount: 0, netAmount: 0, fee: 0 },
      failed: { count: 0, amount: 0, netAmount: 0, fee: 0 },
      declined: { count: 0, amount: 0, netAmount: 0, fee: 0 },
    };

    let totalAmount = 0;
    let totalNetAmount = 0;
    let totalFees = 0;

    for (const p of payments) {
      const st = p.status === 'paid' ? 'successful' : p.status;
      if (!statusCounts[st]) {
        statusCounts[st] = { count: 0, amount: 0, netAmount: 0, fee: 0 };
      }
      statusCounts[st].count++;
      statusCounts[st].amount += p.amount;
      statusCounts[st].netAmount += p.netAmount || p.amount - (p.fee || 0);
      statusCounts[st].fee += p.fee || 0;

      totalAmount += p.amount;
      totalNetAmount += p.netAmount || p.amount - (p.fee || 0);
      totalFees += p.fee || 0;
    }

    // Payout Timeline (grouped by date)
    const timelineMap: Record<
      string,
      { date: string; amount: number; count: number; status: string }
    > = {};
    for (const p of payments) {
      const d = p.createdAt ? p.createdAt.toISOString().slice(0, 10) : 'unknown';
      if (!timelineMap[d]) {
        timelineMap[d] = { date: d, amount: 0, count: 0, status: p.status };
      }
      timelineMap[d].amount += p.amount;
      timelineMap[d].count++;
    }

    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate designer global earnings
    const designerStats = await this.getDesignerPerformance(query);

    return {
      financials: {
        totalDesignerEarnings: designerStats.totals.totalEarned,
        processedPayments: statusCounts.successful.amount,
        pendingPayments:
          statusCounts.pending.amount +
          statusCounts.approved.amount +
          statusCounts.processing.amount,
        outstandingPayments: designerStats.totals.totalOutstanding,
        totalFeesGenerated: totalFees,
        totalPayoutRecords: payments.length,
      },
      statusDistribution: statusCounts,
      timeline,
      recentPayouts: payments.slice(0, 20).map((p) => ({
        id: p.id,
        designerId: p.designerId,
        designerName: p.designer?.fullName,
        designerEmail: p.designer?.email,
        amount: p.amount,
        netAmount: p.netAmount || p.amount - (p.fee || 0),
        fee: p.fee || 0,
        status: p.status,
        payoutType: p.payoutType,
        reference: p.reference,
        bankName: p.bankName,
        accountNumber: p.accountNumber,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
      settings: {
        perImageAmount,
        perImageToCodeAmount,
        manualPayoutFeePercent: settings?.manualPayoutFeePercent || 2,
        payoutSchedule: settings?.payoutSchedule || 'weekly',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 5. OPERATIONAL REPORTS (WORKFLOW & FUNNEL)
  // ---------------------------------------------------------------------------
  async getOperationalWorkflow(query: DesignReportsQueryDto) {
    const { start, end } = this.getDateBounds(query);

    // 1. Task stage queries
    const taskConditions = [];
    if (start) taskConditions.push(gte(schema.tasks.createdAt, start));
    if (end) taskConditions.push(lte(schema.tasks.createdAt, end));
    if (query.designerId && UUID_REGEX.test(query.designerId)) {
      taskConditions.push(eq(schema.tasks.assignedTo, query.designerId));
    }

    const tasks = await this.db.query.tasks.findMany({
      where: taskConditions.length > 0 ? and(...taskConditions) : undefined,
    });

    const openTasks = tasks.filter((t) => t.status === 'open').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;

    // 2. Submission stage queries
    const subConditions = [];
    if (start) subConditions.push(gte(schema.submissions.createdAt, start));
    if (end) subConditions.push(lte(schema.submissions.createdAt, end));
    if (query.designerId && UUID_REGEX.test(query.designerId)) {
      subConditions.push(eq(schema.submissions.designerId, query.designerId));
    }

    const submissions = await this.db.query.submissions.findMany({
      where: subConditions.length > 0 ? and(...subConditions) : undefined,
    });

    const drafts = submissions.filter((s) => s.status === 'draft').length;
    const awaitingReview = submissions.filter((s) =>
      ['submitted', 'received', 'under_review', 'resubmitted'].includes(s.status),
    ).length;
    const inRevision = submissions.filter((s) => s.status === 'revision_required').length;
    const approvedSubmissions = submissions.filter((s) =>
      ['approved', 'completed'].includes(s.status),
    ).length;

    // Pipeline funnel stages
    const funnel = [
      {
        stage: 'Open Requests',
        count: openTasks,
        color: '#3B82F6',
        description: 'Assigned tasks not yet started',
      },
      {
        stage: 'Work in Progress',
        count: inProgressTasks + drafts,
        color: '#F59E0B',
        description: 'Tasks underway and draft submissions',
      },
      {
        stage: 'Awaiting Review',
        count: awaitingReview,
        color: '#8B5CF6',
        description: 'Designs submitted and awaiting staff review',
      },
      {
        stage: 'Revision Required',
        count: inRevision,
        color: '#EC4899',
        description: 'Designs needing adjustments',
      },
      {
        stage: 'Approved & Completed',
        count: approvedSubmissions,
        color: '#10B981',
        description: 'Designs approved for production',
      },
    ];

    const totalWorkItems = tasks.length + submissions.length;
    const throughputRate =
      totalWorkItems > 0 ? Math.round((approvedSubmissions / totalWorkItems) * 100) : 0;

    return {
      funnel,
      metrics: {
        totalTasks: tasks.length,
        openTasks,
        inProgressTasks,
        completedTasks,
        totalSubmissions: submissions.length,
        awaitingReview,
        inRevision,
        approvedSubmissions,
        throughputRate,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 6. EXECUTIVE OVERVIEW
  // ---------------------------------------------------------------------------
  async getOverview(query: DesignReportsQueryDto) {
    const [designPerf, designerPerf, staffPerf, paymentEarnings, operational] = await Promise.all([
      this.getDesignPerformance(query),
      this.getDesignerPerformance(query),
      this.getStaffPerformance(query),
      this.getPaymentEarnings(query),
      this.getOperationalWorkflow(query),
    ]);

    return {
      kpis: {
        totalSubmissions: designPerf.summary.totalSubmissions,
        approvedDesigns: designPerf.summary.totalApproved,
        pendingReviews: designPerf.summary.pendingReviews,
        activeWorkload:
          operational.metrics.openTasks +
          operational.metrics.inProgressTasks +
          operational.metrics.awaitingReview,
        approvalRate: designPerf.summary.approvalRate,
        totalDesigners: designerPerf.totals.totalDesigners,
        totalEarned: paymentEarnings.financials.totalDesignerEarnings,
        totalPaid: paymentEarnings.financials.processedPayments,
        outstandingBalance: paymentEarnings.financials.outstandingPayments,
      },
      funnel: operational.funnel,
      categories: designPerf.categories.slice(0, 5),
      topDesigners: designerPerf.designers.slice(0, 5),
      staffActivityOverview: staffPerf.totals,
      recentPayouts: paymentEarnings.recentPayouts.slice(0, 5),
    };
  }
}
