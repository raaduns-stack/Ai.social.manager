import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, sum, count, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { seedPlans as runPlansSeeding } from '../database/seeding';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserRole } from '../common/enums/roles.enum';
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
        where: eq(schema.subscriptions.userId, u.id),
        with: {
          plan: true,
        },
      });
      usersWithPlan.push({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        joinedDate: u.createdAt,
        plan: activeSub?.plan?.name || 'Free',
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
      where: eq(schema.subscriptions.userId, userId),
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
}
