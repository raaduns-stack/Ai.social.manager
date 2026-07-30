import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sum, count } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
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
      subscription: activeSub ? {
        id: activeSub.id,
        status: activeSub.status,
        currentPeriodStart: activeSub.currentPeriodStart,
        currentPeriodEnd: activeSub.currentPeriodEnd,
        plan: activeSub.plan,
      } : null,
      payments: userPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        gateway: p.gateway,
        gatewayReference: p.gatewayReference,
        createdAt: p.createdAt,
        planName: p.plan?.name || 'Plan Change',
      })),
      invoices: userInvoices.map(inv => ({
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
    return { success: true, isActive: !suspend };
  }

  async deleteUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
    return subs.map(s => ({
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
    return pays.map(p => ({
      id: p.id,
      customerName: p.user?.fullName || '—',
      plan: p.plan?.name || '—',
      amount: p.amount,
      date: p.createdAt,
      method: p.gateway,
      status: p.status,
    }));
  }
}
