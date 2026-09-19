import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, or, sql, count, ne, gte, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UserRole } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AdminDesignerManagementService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Helper to get start date for daily/weekly/monthly filters
   */
  private getStartDateForPeriod(period?: string): Date | null {
    if (!period || period === 'all') return null;
    const now = new Date();
    if (period === 'daily') {
      return new Date(now.setHours(0, 0, 0, 0));
    }
    if (period === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    }
    if (period === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null;
  }

  async getDashboardSummary(period?: string) {
    const startDate = this.getStartDateForPeriod(period);

    // 1. Designers Stats
    const allDesigners = await this.db.query.users.findMany({
      where: and(
        eq(schema.users.role, UserRole.DESIGNER as any),
        ne(schema.users.accountStatus, 'DELETED'),
      ),
    });

    const totalDesigners = allDesigners.length;
    const activeDesigners = allDesigners.filter((d) => d.accountStatus === 'ACTIVE').length;

    // 2. Tasks Stats
    const tasksQuery = this.db.select().from(schema.tasks);
    // Since assignedTo might not be typed to designer, we just fetch all tasks. In reality, tasks are assigned to designers.
    const allTasks = await tasksQuery;

    let totalAssignedTasks = 0;
    let pendingTasks = 0;
    let completedTasks = 0;

    for (const t of allTasks) {
      if (startDate && new Date(t.createdAt) < startDate) continue;

      totalAssignedTasks++;
      if (t.status === 'done') {
        completedTasks++;
      } else {
        pendingTasks++;
      }
    }

    // 3. Submissions Stats
    const subsQuery = this.db.select().from(schema.submissions);
    const allSubs = await subsQuery;

    let pendingSubmissions = 0;
    let approvedDesigns = 0;

    for (const s of allSubs) {
      if (startDate && new Date(s.createdAt) < startDate) continue;

      if (s.status === 'approved') {
        approvedDesigns++;
      } else if (['submitted', 'resubmitted', 'under_review'].includes(s.status)) {
        pendingSubmissions++;
      }
    }

    // 4. Earnings/Payments
    const payQuery = this.db.select().from(schema.designerPayments);
    const allPayments = await payQuery;

    let totalEarnings = 0;
    let pendingPayments = 0;

    for (const p of allPayments) {
      if (startDate && new Date(p.createdAt) < startDate) continue;

      if (p.status === 'paid') {
        totalEarnings += p.amount;
      } else if (['pending', 'processing'].includes(p.status)) {
        pendingPayments += p.amount;
      }
    }

    return {
      totalDesigners,
      activeDesigners,
      totalAssignedTasks,
      pendingTasks,
      completedTasks,
      pendingSubmissions,
      approvedDesigns,
      totalEarnings,
      pendingPayments,
    };
  }

  async getTasks(period?: string) {
    const startDate = this.getStartDateForPeriod(period);

    let whereClause = undefined;
    if (startDate) {
      whereClause = gte(schema.tasks.createdAt, startDate);
    }

    const taskList = await this.db.query.tasks.findMany({
      where: whereClause,
      with: {
        assignee: { columns: { fullName: true, email: true } },
        assigner: { columns: { fullName: true } },
      },
      orderBy: [desc(schema.tasks.createdAt)],
    });

    return taskList.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      assignedTo: t.assignee?.fullName || 'Unassigned',
      assignedBy: t.assigner?.fullName || 'System',
    }));
  }

  async getSubmissions(period?: string) {
    const startDate = this.getStartDateForPeriod(period);

    let whereClause = undefined;
    if (startDate) {
      whereClause = gte(schema.submissions.createdAt, startDate);
    }

    const subList = await this.db.query.submissions.findMany({
      where: whereClause,
      with: {
        designer: { columns: { fullName: true, email: true } },
        task: { columns: { title: true } },
      },
      orderBy: [desc(schema.submissions.createdAt)],
    });

    return subList.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      status: s.status,
      createdAt: s.createdAt,
      designerName: s.designer?.fullName || 'Unknown',
      taskTitle: s.task?.title || 'Standalone Submission',
    }));
  }

  async getPayments(period?: string) {
    const startDate = this.getStartDateForPeriod(period);

    let whereClause = undefined;
    if (startDate) {
      whereClause = gte(schema.designerPayments.createdAt, startDate);
    }

    const payList = await this.db.query.designerPayments.findMany({
      where: whereClause,
      with: {
        designer: { columns: { fullName: true, email: true } },
      },
      orderBy: [desc(schema.designerPayments.createdAt)],
    });

    return payList.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      designerName: p.designer?.fullName || 'Unknown',
    }));
  }

  async getActivities(period?: string) {
    const startDate = this.getStartDateForPeriod(period);

    let whereClause = undefined;
    if (startDate) {
      whereClause = gte(schema.activityLogs.createdAt, startDate);
    }

    // Since we don't have a strict designer_management module in activity logs,
    // we fetch logs where the action indicates designer activity.
    // In a real app we'd filter by module. For now we fetch recent general logs.
    const acts = await this.db.query.activityLogs.findMany({
      where: whereClause,
      orderBy: [desc(schema.activityLogs.createdAt)],
      limit: 50,
    });

    return acts.map((a) => ({
      id: a.id,
      action: a.action,
      description: a.description,
      userName: a.userName,
      createdAt: a.createdAt,
    }));
  }

  async getDesigners() {
    const designers = await this.db.query.users.findMany({
      where: and(
        eq(schema.users.role, UserRole.DESIGNER as any),
        ne(schema.users.accountStatus, 'DELETED'),
      ),
      orderBy: [desc(schema.users.createdAt)],
    });

    const result = [];
    for (const d of designers) {
      // Calculate workload (tasks not done)
      const pendingTasks = await this.db
        .select({ count: count() })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.assignedTo, d.id), ne(schema.tasks.status, 'done')));

      const completedTasks = await this.db
        .select({ count: count() })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.assignedTo, d.id), eq(schema.tasks.status, 'done')));

      const approvedSubmissions = await this.db
        .select({ count: count() })
        .from(schema.submissions)
        .where(
          and(eq(schema.submissions.designerId, d.id), eq(schema.submissions.status, 'approved')),
        );

      const totalTasksCount = (pendingTasks[0]?.count || 0) + (completedTasks[0]?.count || 0);
      const approvalRate =
        totalTasksCount > 0
          ? Math.round(((approvedSubmissions[0]?.count || 0) / totalTasksCount) * 100)
          : 0;

      result.push({
        id: d.id,
        name: d.fullName,
        email: d.email,
        accountStatus: d.accountStatus,
        createdAt: d.createdAt,
        workload: pendingTasks[0]?.count || 0,
        completedTasks: completedTasks[0]?.count || 0,
        approvalRate: approvalRate,
      });
    }

    return result;
  }

  async getDesignerProfile(id: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(schema.users.id, id), eq(schema.users.role, UserRole.DESIGNER as any)),
    });
    if (!user) throw new NotFoundException('Designer not found');

    const profile = await this.db.query.designerProfiles.findFirst({
      where: eq(schema.designerProfiles.userId, id),
    });

    // Work Info
    const tasks = await this.db.query.tasks.findMany({
      where: eq(schema.tasks.assignedTo, id),
      orderBy: [desc(schema.tasks.createdAt)],
    });

    const submissions = await this.db.query.submissions.findMany({
      where: eq(schema.submissions.designerId, id),
      orderBy: [desc(schema.submissions.createdAt)],
    });

    const payments = await this.db.query.designerPayments.findMany({
      where: eq(schema.designerPayments.designerId, id),
      orderBy: [desc(schema.designerPayments.createdAt)],
    });

    const activeTasks = tasks.filter((t) => t.status !== 'done').length;
    const completedTasksCount = tasks.filter((t) => t.status === 'done').length;
    const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;

    const totalEarnings = payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + p.amount, 0);
    const pendingEarnings = payments
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      personalInfo: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        accountStatus: user.accountStatus,
        isActive: user.isActive,
      },
      professionalInfo: {
        bio: profile?.bio || 'No bio available',
        specialties: profile?.specialties || [],
        portfolioUrl: profile?.portfolioUrl || '',
      },
      workInfo: {
        activeAssignments: activeTasks,
        completedAssignments: completedTasksCount,
        approvedWork: approvedSubmissions,
        approvalRate: tasks.length > 0 ? Math.round((approvedSubmissions / tasks.length) * 100) : 0,
      },
      paymentInfo: {
        totalEarnings,
        pendingAmount: pendingEarnings,
      },
      history: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          date: t.createdAt,
        })),
        submissions: submissions.map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          date: s.createdAt,
        })),
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          date: p.createdAt,
        })),
      },
    };
  }
}
