import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, sum, count, and, desc, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { seedPlans as runPlansSeeding } from '../database/seeding';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserRole, ALL_ADMIN_ROLES } from '../common/enums/roles.enum';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async getUsers() {
    const allUsers = await this.db.query.users.findMany();
    const usersWithPlan = [];
    for (const u of allUsers) {
      const activeSub = await this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.userId, u.id),
          eq(schema.subscriptions.status, 'active'),
        ),
        with: {
          plan: true,
        },
      });
      const planSlug = activeSub?.plan?.slug || 'free';
      const isPaid = Boolean(planSlug) && planSlug !== 'free';
      usersWithPlan.push({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        joinedDate: u.createdAt,
        plan: activeSub?.plan?.name || 'Free',
        planSlug,
        isPaid,
        status: u.isActive ? 'Active' : 'Suspended',
      });
    }
    return usersWithPlan;
  }

  async getUserDetail(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeSub = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, 'active'),
      ),
      with: {
        plan: true,
      },
    });

    const userPayments = await this.db.query.payments.findMany({
      where: eq(schema.payments.userId, userId),
      with: {
        plan: true,
      },
    });

    const userInvoices = await this.db.query.invoices.findMany({
      where: eq(schema.invoices.userId, userId),
    });

    const userSocialAccounts = await this.db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
    });

    const userActivityLogs = await this.db.query.activityLogs.findMany({
      where: eq(schema.activityLogs.userId, userId),
      orderBy: desc(schema.activityLogs.createdAt),
      limit: 20,
    });

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      joinedDate: user.createdAt,
      businessName: user.businessName,
      status: user.isActive ? 'Active' : 'Suspended',
      plan: activeSub?.plan?.name || 'Free',
      planSlug: activeSub?.plan?.slug || 'free',
      isPaid: (activeSub?.plan?.slug ?? 'free') !== 'free',
      subscription: activeSub
        ? {
            id: activeSub.id,
            status: activeSub.status,
            currentPeriodStart: activeSub.currentPeriodStart,
            currentPeriodEnd: activeSub.currentPeriodEnd,
            plan: activeSub.plan,
          }
        : null,
      payments: userPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        gateway: p.gateway,
        gatewayReference: p.gatewayReference,
        createdAt: p.createdAt,
        planName: p.plan?.name || 'Plan Change',
      })),
      invoices: userInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        issuedAt: inv.issuedAt,
        pdfUrl: inv.pdfUrl,
      })),
      socialAccounts: userSocialAccounts.map((sa) => ({
        id: sa.id,
        platform: sa.platform,
        accountHandle: sa.accountHandle,
        status: sa.status === 'connected' ? 'Connected' : 'Disconnected',
        connectedAt: sa.connectedAt,
      })),
      activities: userActivityLogs.map((al) => ({
        id: al.id,
        title: al.action,
        description: al.description,
        time: al.createdAt,
      })),
    };
  }

  async suspendUser(userId: string, suspend: boolean) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.db
      .update(schema.users)
      .set({ isActive: !suspend })
      .where(eq(schema.users.id, userId));

    // Record the action automatically
    await this.activityLogsService.record({
      userId,
      userName: user.fullName,
      action: suspend ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      module: 'Users',
      description: suspend
        ? `Admin suspended user account: ${user.email}`
        : `Admin activated user account: ${user.email}`,
    });

    return { success: true, isActive: !suspend };
  }

  async deleteUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Record BEFORE delete so user info is still available
    await this.activityLogsService.record({
      userId: null, // user is being deleted; don't keep a FK reference
      userName: user.fullName,
      action: 'USER_DELETED',
      module: 'Users',
      description: `Admin permanently deleted user account: ${user.email}`,
    });

    await this.db.delete(schema.users).where(eq(schema.users.id, userId));
    return { success: true };
  }

  async getBillingStats() {
    const revenueResult = await this.db
      .select({ val: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(eq(schema.payments.status, 'successful'));

    const subResult = await this.db
      .select({ val: count(schema.subscriptions.id) })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));

    const pendingResult = await this.db
      .select({ val: count(schema.payments.id) })
      .from(schema.payments)
      .where(eq(schema.payments.status, 'pending'));

    return {
      totalRevenue: Number(revenueResult[0]?.val || 0),
      activeSubscriptions: Number(subResult[0]?.val || 0),
      pendingPayments: Number(pendingResult[0]?.val || 0),
    };
  }

  async getSubscriptions() {
    const subs = await this.db.query.subscriptions.findMany({
      with: {
        user: true,
        plan: true,
      },
    });
    return subs.map((s) => ({
      id: s.id,
      customerName: s.user?.fullName || '—',
      email: s.user?.email || '—',
      plan: s.plan?.name || '—',
      status: s.status,
      renewsOn: s.currentPeriodEnd,
      amount: s.plan?.price || 0,
    }));
  }

  async getPayments() {
    const pays = await this.db.query.payments.findMany({
      with: {
        user: true,
        plan: true,
      },
    });
    return pays.map((p) => ({
      id: p.id,
      customerName: p.user?.fullName || '—',
      plan: p.plan?.name || '—',
      amount: p.amount,
      date: p.createdAt,
      method: p.gateway,
      status: p.status,
    }));
  }

  async seedPlans() {
    await runPlansSeeding(this.db);
    return { success: true, message: 'Canonical plans seeded successfully' };
  }

  async getRolePermissions() {
    return this.db.query.rolePermissions.findMany();
  }

  async updateRolePermissions(dto: { role: string; permissions: { module: string; accessLevel: string }[] }) {
    for (const p of dto.permissions) {
      const existing = await this.db.query.rolePermissions.findFirst({
        where: and(
          eq(schema.rolePermissions.role, dto.role as any),
          eq(schema.rolePermissions.module, p.module),
        ),
      });

      if (existing) {
        await this.db
          .update(schema.rolePermissions)
          .set({ accessLevel: p.accessLevel as any })
          .where(eq(schema.rolePermissions.id, existing.id));
      } else {
        await this.db.insert(schema.rolePermissions).values({
          role: dto.role as any,
          module: p.module,
          accessLevel: p.accessLevel as any,
        });
      }
    }
    return { success: true };
  }

  async createStaff(dto: CreateStaffDto) {
    const ALLOWED_STAFF_ROLES = [
      UserRole.SUPER_ADMIN,
      UserRole.ACCOUNT_MANAGER,
      UserRole.REVIEWER,
      UserRole.SUPPORT_STAFF,
      UserRole.DESIGNER,
    ];

    if (!ALLOWED_STAFF_ROLES.includes(dto.role as UserRole)) {
      throw new BadRequestException('Invalid staff role provided.');
    }

    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role as any,
        isEmailVerified: true,
        isActive: true,
      })
      .returning();

    // Record new staff registration
    void this.activityLogsService.record({
      userId: user.id,
      userName: user.fullName,
      action: 'USER_REGISTERED',
      module: 'Admin',
      description: `New staff member created: ${user.email} with role ${user.role}`,
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async getStaffOverview() {
    const staff = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        email: schema.users.email,
        role: schema.users.role,
        isActive: schema.users.isActive,
      })
      .from(schema.users)
      .where(inArray(schema.users.role, ALL_ADMIN_ROLES));

    const recentLogins = await this.db
      .select({
        id: schema.loginHistory.id,
        email: schema.loginHistory.email,
        status: schema.loginHistory.status,
        isSuspicious: schema.loginHistory.isSuspicious,
        ipAddress: schema.loginHistory.ipAddress,
        browser: schema.loginHistory.browser,
        os: schema.loginHistory.os,
        device: schema.loginHistory.device,
        createdAt: schema.loginHistory.createdAt,
        userName: schema.users.fullName,
        userRole: schema.users.role,
      })
      .from(schema.loginHistory)
      .innerJoin(schema.users, eq(schema.loginHistory.userId, schema.users.id))
      .where(inArray(schema.users.role, ALL_ADMIN_ROLES))
      .orderBy(desc(schema.loginHistory.createdAt))
      .limit(20);

    return {
      totalAdmins: staff.filter((s) => s.role === UserRole.SUPER_ADMIN).length,
      totalStaff: staff.filter((s) => s.role !== UserRole.SUPER_ADMIN).length,
      activeUsers: staff.filter((s) => s.isActive).length,
      disabledAccounts: staff.filter((s) => !s.isActive).length,
      recentLogins: recentLogins.map((row) => ({
        id: row.id,
        name: row.userName || row.email,
        role: row.userRole || '—',
        device: [row.browser, row.os, row.ipAddress].filter(Boolean).join(' · ') || 'Unknown device',
        time: row.createdAt,
        status: row.isSuspicious ? 'Suspicious' : row.status === 'success' ? 'Successful' : 'Failed',
      })),
    };
  }

  async getPlans() {
    return this.db.query.plans.findMany();
  }

  async updatePlan(id: string, dto: any) {
    const existing = await this.db.query.plans.findFirst({
      where: eq(schema.plans.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const updateData: any = { updatedAt: new Date() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.monthlyPostLimit !== undefined) updateData.monthlyPostLimit = dto.monthlyPostLimit;
    if (dto.maxSocialAccounts !== undefined) updateData.maxSocialAccounts = dto.maxSocialAccounts;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.db
      .update(schema.plans)
      .set(updateData)
      .where(eq(schema.plans.id, id));

    return { success: true };
  }

  async getSocialAccounts() {
    const accounts = await this.db
      .select({
        id: schema.social_accounts.id,
        customerName: schema.users.fullName,
        email: schema.users.email,
        platform: schema.social_accounts.platform,
        accountHandle: schema.social_accounts.accountHandle,
        status: schema.social_accounts.status,
        connectedAt: schema.social_accounts.connectedAt,
        tokenExpiresAt: schema.social_accounts.tokenExpiresAt,
      })
      .from(schema.social_accounts)
      .innerJoin(schema.users, eq(schema.social_accounts.userId, schema.users.id))
      .orderBy(desc(schema.social_accounts.createdAt));
    return accounts;
  }

  async disconnectSocialAccount(id: string) {
    const existing = await this.db.query.social_accounts.findFirst({
      where: eq(schema.social_accounts.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Social account not found');
    }
    await this.db
      .update(schema.social_accounts)
      .set({
        status: 'disconnected',
        updatedAt: new Date(),
      })
      .where(eq(schema.social_accounts.id, id));

    // Record activity log
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, existing.userId),
    });
    await this.activityLogsService.record({
      userId: existing.userId,
      userName: user?.fullName || 'System',
      action: 'SOCIAL_ACCOUNT_DISCONNECTED',
      module: 'SocialAccounts',
      description: `Admin disconnected ${existing.platform} account (${existing.accountHandle}) for user ${user?.email}`,
    });

    return { success: true };
  }
}
