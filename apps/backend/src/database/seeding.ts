import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';
import { encryptSecret } from '../common/utils/encryption.util';

type Database = PostgresJsDatabase<typeof schema>;

export async function seedPlans(db: Database) {
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
    const existing = await db.query.plans.findFirst({
      where: eq(schema.plans.slug, p.slug),
    });
    if (existing) {
      await db
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
      await db.insert(schema.plans).values({
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
}

export async function seedSingletons(db: Database, configService: any) {
  // 1. companyProfile
  const profile = await db.query.companyProfile.findFirst();
  if (!profile) {
    await db.insert(schema.companyProfile).values({
      companyName: 'SocialPilot AI',
      contactEmail: configService.get('mail.senderEmail') || configService.get('mail.mailFrom') || 'info@raasocial.io',
      website: 'raasocial.io',
    });
  }

  // 2. systemSettings
  const settings = await db.query.systemSettings.findFirst();
  if (!settings) {
    await db.insert(schema.systemSettings).values({
      defaultTimezone: 'Africa/Lagos',
      maintenanceMode: false,
      allowNewRegistrations: true,
      contentApprovalRequired: true,
      dateFormat: 'DD/MM/YYYY',
    });
  }

  // 3. emailConfig
  const emailConfig = await db.query.emailConfig.findFirst();
  if (!emailConfig) {
    const smtpHost = configService.get('mail.smtpHost') || 'mail.raasocial.io';
    const smtpPort = configService.get('mail.smtpPort') || 465;
    const smtpSecure = configService.get('mail.smtpSecure') ?? true;
    const smtpUsername = configService.get('mail.smtpUsername') || '';
    const smtpPassword = configService.get('mail.smtpPassword') || '';
    const smtpPasswordEncrypted = smtpPassword ? encryptSecret(smtpPassword) : '';
    const senderName = configService.get('mail.senderName') || 'SocialPilot AI';
    const senderEmail = configService.get('mail.senderEmail') || configService.get('mail.mailFrom') || 'noreply@raasocial.io';

    await db.insert(schema.emailConfig).values({
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPasswordEncrypted,
      senderName,
      senderEmail,
    });
  }

  // 4. paymentGatewaySettings
  const gatewaySettings = await db.query.paymentGatewaySettings.findFirst();
  if (!gatewaySettings) {
    await db.insert(schema.paymentGatewaySettings).values({
      gateway: 'flutterwave',
      supportedMethods: ['card'],
      isLiveMode: false,
      isEnabled: true,
    });
  }
}

export async function seedRolePermissions(db: Database) {
  const matrix: Record<string, Record<string, string>> = {
    super_admin: {
      dashboard: 'full',
      user_management: 'full',
      billing: 'full',
      social_accounts: 'full',
      content_calendar: 'full',
      content_creation: 'full',
      upload_management: 'full',
      analytics: 'full',
      ai_config: 'full',
      support: 'full',
      notification_management: 'full',
      settings: 'full',
      audit_logs: 'full',
      staff_management: 'full',
      money_management: 'full',
    },
    account_manager: {
      dashboard: 'view',
      user_management: 'own_only',
      billing: 'view',
      social_accounts: 'manage',
      content_calendar: 'manage',
      content_creation: 'manage',
      upload_management: 'manage',
      analytics: 'view',
      ai_config: 'none',
      support: 'own_only',
      notification_management: 'manage',
      settings: 'own_only',
      audit_logs: 'none',
      staff_management: 'none',
      money_management: 'none',
    },
    reviewer: {
      dashboard: 'view',
      user_management: 'none',
      billing: 'none',
      social_accounts: 'view',
      content_calendar: 'view',
      content_creation: 'view',
      upload_management: 'view',
      analytics: 'view',
      ai_config: 'none',
      support: 'none',
      notification_management: 'none',
      settings: 'own_only',
      audit_logs: 'none',
      staff_management: 'none',
      money_management: 'none',
    },
    support_staff: {
      dashboard: 'view',
      user_management: 'view',
      billing: 'none',
      social_accounts: 'none',
      content_calendar: 'none',
      content_creation: 'none',
      upload_management: 'none',
      analytics: 'none',
      ai_config: 'none',
      support: 'full',
      notification_management: 'view',
      settings: 'own_only',
      audit_logs: 'none',
      staff_management: 'none',
      money_management: 'none',
    },
    designer: {
      dashboard: 'none',
      user_management: 'none',
      billing: 'none',
      social_accounts: 'none',
      content_calendar: 'own_only',
      content_creation: 'view',
      upload_management: 'manage',
      analytics: 'none',
      ai_config: 'none',
      support: 'none',
      notification_management: 'none',
      settings: 'own_only',
      audit_logs: 'none',
      staff_management: 'none',
      money_management: 'none',
    },
  };

  for (const [role, modules] of Object.entries(matrix)) {
    for (const [moduleName, accessLevel] of Object.entries(modules)) {
      const existing = await db.query.rolePermissions.findFirst({
        where: and(
          eq(schema.rolePermissions.role, role as any),
          eq(schema.rolePermissions.module, moduleName),
        ),
      });

      if (existing) {
        await db
          .update(schema.rolePermissions)
          .set({ accessLevel: accessLevel as any } as any)
          .where(eq(schema.rolePermissions.id, existing.id));
      } else {
        await db.insert(schema.rolePermissions).values({
          role: role as any,
          module: moduleName,
          accessLevel: accessLevel as any,
        });
      }
    }
  }
}

