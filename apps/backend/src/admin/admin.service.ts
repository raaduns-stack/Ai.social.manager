import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sum, count } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AdminService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

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
    const canonicalPlans = [
      {
        slug: 'free',
        name: 'Free',
        price: 0,
        interval: 'monthly' as const,
        isActive: true,
        maxSocialAccounts: 1,
        features: [
          'Connect 1 social media account',
          'Generate 5 AI posts per month',
          'AI-generated caption + hashtags',
          'Basic AI image generation',
          'Content preview',
          'Basic analytics',
          'AI/WhatsApp Support',
        ],
      },
      {
        slug: 'starter',
        name: 'Starter',
        price: 3000000,
        interval: 'monthly' as const,
        isActive: true,
        maxSocialAccounts: 3,
        features: [
          'Everything in Free, plus:',
          'Connect 3 social media accounts',
          '30 AI-generated posts/month',
          'AI-generated captions & hashtags',
          'AI-generated images',
          'Content Calendar',
          'Post Scheduling',
          'Upload Brand Assets',
          'Basic Analytics Dashboard',
          'AI Content Suggestions',
          'AI/WhatsApp Support',
        ],
      },
      {
        slug: 'growth',
        name: 'Growth',
        price: 10000000,
        interval: 'monthly' as const,
        isActive: true,
        maxSocialAccounts: 7,
        features: [
          'Everything in Starter, plus:',
          'Connect 7 social media accounts',
          '150 AI-generated posts/month (Fair Use)',
          'Advanced AI Image Generation',
          'AI Content Calendar',
          'Competitor Analysis & Website Analysis',
          'AI Content Improvement Suggestions',
          'Performance Insights & Weekly Reports',
          'Team Members (up to 5)',
          'Priority AI Generation',
          'Content Approval Workflow',
          'Advanced Analytics',
          'AI/WhatsApp Support',
          'Bonus: Monthly AI Strategy Report',
          'Early access to new features',
        ],
      },
      {
        slug: 'enterprise',
        name: 'Brand Domination',
        price: 15000000,
        interval: 'monthly' as const,
        isActive: true,
        maxSocialAccounts: 15,
        features: [
          'Everything in Growth, plus:',
          'Connect 15 social media accounts',
          '300 AI-generated posts/month (Fair Use)',
          'Unlimited Team Members',
          'AI Marketing Strategy & Campaign Planner',
          'AI Seasonal Campaign Suggestions',
          'Advanced Competitor Intelligence',
          'Multi-location Business Support',
          'Multiple Brand Management',
          'Dedicated Account Manager',
          'Feature Request Priority',
          'Custom AI Workflows',
          'AI/WhatsApp Support',
          'Bonus: Dedicated Success Manager',
          'Beta Features Access',
        ],
      },
    ];

    for (const p of canonicalPlans) {
      const existing = await this.db.query.plans.findFirst({
        where: eq(schema.plans.slug, p.slug),
      });
      if (existing) {
        await this.db
          .update(schema.plans)
          .set({
            name: p.name,
            price: p.price,
            interval: p.interval,
            isActive: p.isActive,
            features: p.features,
            maxSocialAccounts: p.maxSocialAccounts,
            updatedAt: new Date(),
          })
          .where(eq(schema.plans.id, existing.id));
      } else {
        await this.db.insert(schema.plans).values({
          name: p.name,
          slug: p.slug,
          price: p.price,
          interval: p.interval,
          isActive: p.isActive,
          features: p.features,
          maxSocialAccounts: p.maxSocialAccounts,
        });
      }
    }

    return { success: true, message: 'Canonical plans seeded successfully' };
  }
}
