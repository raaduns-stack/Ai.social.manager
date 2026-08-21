import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, desc, and, or, ilike, sum, count, ne, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { seedPlans as runPlansSeeding } from '../database/seeding';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserRole, ALL_ADMIN_ROLES } from '../common/enums/roles.enum';

type Database = PostgresJsDatabase<typeof schema>;
const SALT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Returns list of all users, ordered by createdAt DESC (newest first).
   * Supports search, filter tabs, plan, status, and country.
   */
  async getUsers(query?: {
    search?: string;
    tab?: string;
    status?: string;
    plan?: string;
    country?: string;
    kycStatus?: string;
  }) {
    const allUsers = await this.db.query.users.findMany({
      orderBy: [desc(schema.users.createdAt)],
      with: {
        accountManager: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const result = [];

    for (const u of allUsers) {
      // Exclude soft-deleted users from default lists if tab != 'deleted'
      if (u.accountStatus === 'DELETED' && query?.tab !== 'deleted') {
        continue;
      }

      // Fetch active subscription & plan
      const activeSub = await this.db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.userId, u.id),
        with: {
          plan: true,
        },
        orderBy: [desc(schema.subscriptions.updatedAt)],
      });

      // Fetch latest KYC submission
      const kycRecord = await this.db.query.kyc.findFirst({
        where: eq(schema.kyc.userId, u.id),
        orderBy: [desc(schema.kyc.submittedAt)],
      });

      // Map KYC status to standard user-friendly status badge label
      let kycStatusLabel = 'NOT_STARTED';
      if (kycRecord) {
        if (kycRecord.status === 'approved') kycStatusLabel = 'APPROVED';
        else if (kycRecord.status === 'rejected') kycStatusLabel = 'REJECTED';
        else if (kycRecord.status === 'resubmission_required') kycStatusLabel = 'RESUBMISSION_REQUIRED';
        else if (kycRecord.status === 'pending') kycStatusLabel = 'UNDER_REVIEW';
      }

      const planName = activeSub?.plan?.name || 'Free';
      const isPaidPlan = planName.toLowerCase() !== 'free';

      const userObj = {
        id: u.id,
        name: u.fullName,
        fullName: u.fullName,
        email: u.email,
        businessName: u.businessName || kycRecord?.businessName || '—',
        phoneNumber: u.phoneNumber || kycRecord?.businessPhone || '—',
        country: u.country || kycRecord?.country || '—',
        profileImage: u.profileImage || null,
        role: u.role,
        accountStatus: u.accountStatus,
        isActive: u.isActive,
        isEmailVerified: u.isEmailVerified,
        joinedDate: u.createdAt,
        registeredAt: u.registeredAt || u.createdAt,
        emailVerifiedAt: u.emailVerifiedAt,
        firstLoginAt: u.firstLoginAt,
        lastLoginAt: u.lastLoginAt,
        suspendedAt: u.suspendedAt,
        plan: planName,
        isPaid: isPaidPlan,
        kycStatus: kycStatusLabel,
        kycRecordId: kycRecord?.id || null,
        accountManager: u.accountManager
          ? {
              id: u.accountManager.id,
              name: u.accountManager.fullName,
              email: u.accountManager.email,
            }
          : null,
        status: u.accountStatus === 'SUSPENDED' || !u.isActive
          ? 'Suspended'
          : u.accountStatus === 'EMAIL_VERIFICATION_PENDING' || !u.isEmailVerified
          ? 'Email Pending'
          : 'Active',
      };

      // Apply Search filter across name, email, businessName, country
      if (query?.search) {
        const s = query.search.toLowerCase();
        const matchesSearch =
          userObj.name.toLowerCase().includes(s) ||
          userObj.email.toLowerCase().includes(s) ||
          userObj.businessName.toLowerCase().includes(s) ||
          userObj.country.toLowerCase().includes(s);
        if (!matchesSearch) continue;
      }

      // Apply Tab / Status Filters
      if (query?.tab) {
        const t = query.tab.toLowerCase();
        if (t === 'verified' && (userObj.accountStatus !== 'ACTIVE' || !userObj.isEmailVerified)) {
          continue;
        }
        if (t === 'email_pending' && (userObj.isEmailVerified && userObj.accountStatus !== 'EMAIL_VERIFICATION_PENDING')) {
          continue;
        }
        if (t === 'kyc_pending' && (userObj.kycStatus === 'APPROVED')) {
          continue;
        }
        if (t === 'kyc_under_review' && (userObj.kycStatus !== 'UNDER_REVIEW' && userObj.kycStatus !== 'RESUBMISSION_REQUIRED')) {
          continue;
        }
        if (t === 'suspended' && userObj.accountStatus !== 'SUSPENDED') {
          continue;
        }
        if (t === 'deleted' && userObj.accountStatus !== 'DELETED') {
          continue;
        }
      }

      if (query?.status && query.status !== 'all') {
        if (query.status.toLowerCase() === 'active' && userObj.status !== 'Active') continue;
        if (query.status.toLowerCase() === 'suspended' && userObj.status !== 'Suspended') continue;
        if (query.status.toLowerCase() === 'email pending' && userObj.status !== 'Email Pending') continue;
      }

      if (query?.plan && query.plan !== 'all') {
        if (userObj.plan.toLowerCase() !== query.plan.toLowerCase()) continue;
      }

      if (query?.country && query.country !== 'all') {
        if (userObj.country.toLowerCase() !== query.country.toLowerCase()) continue;
      }

      result.push(userObj);
    }

    return result;
  }

  /**
   * Returns calculated statistics counters across full database.
   */
  async getUserStats() {
    const allUsers = await this.db.query.users.findMany();
    const allKycs = await this.db.query.kyc.findMany();
    const allSubs = await this.db.query.subscriptions.findMany({
      with: { plan: true },
    });

    let totalUsers = 0;
    let activeUsers = 0;
    let pendingVerification = 0;
    let kycPending = 0;
    let kycUnderReview = 0;
    let suspendedUsers = 0;
    let freeUsers = 0;
    let paidUsers = 0;

    const userKycMap = new Map<string, string>();
    for (const k of allKycs) {
      // Keep most recent status
      if (!userKycMap.has(k.userId)) {
        userKycMap.set(k.userId, k.status);
      }
    }

    const userPlanMap = new Map<string, string>();
    for (const s of allSubs) {
      if (s.status === 'active' && s.plan) {
        userPlanMap.set(s.userId, s.plan.slug || s.plan.name.toLowerCase());
      }
    }

    for (const u of allUsers) {
      if (u.accountStatus === 'DELETED') continue;

      totalUsers++;

      if (u.accountStatus === 'SUSPENDED' || !u.isActive) {
        suspendedUsers++;
      } else if (!u.isEmailVerified || u.accountStatus === 'EMAIL_VERIFICATION_PENDING') {
        pendingVerification++;
      } else if (u.accountStatus === 'ACTIVE') {
        activeUsers++;
      }

      const kStatus = userKycMap.get(u.id);
      if (!kStatus || kStatus === 'rejected') {
        kycPending++;
      } else if (kStatus === 'pending' || kStatus === 'resubmission_required') {
        kycUnderReview++;
      }

      const planSlug = userPlanMap.get(u.id) || 'free';
      if (planSlug === 'free') {
        freeUsers++;
      } else {
        paidUsers++;
      }
    }

    return {
      totalUsers,
      activeUsers,
      pendingVerification,
      kycPending,
      kycUnderReview,
      suspendedUsers,
      freeUsers,
      paidUsers,
    };
  }

  /**
   * Gets list of staff and admin accounts available for account manager assignment.
   */
  async getStaffManagers() {
    const staff = await this.db.query.users.findMany({
      where: ne(schema.users.accountStatus, 'DELETED'),
    });

    return staff
      .filter((s) => ALL_ADMIN_ROLES.includes(s.role as any))
      .map((s) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        role: s.role,
      }));
  }

  /**
   * Returns complete user details view with all registration and system information.
   */
  async getUserDetail(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        accountManager: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeSub = await this.db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId),
      with: {
        plan: true,
      },
      orderBy: [desc(schema.subscriptions.updatedAt)],
    });

    const userPayments = await this.db.query.payments.findMany({
      where: eq(schema.payments.userId, userId),
      with: {
        plan: true,
      },
      orderBy: [desc(schema.payments.createdAt)],
    });

    const userInvoices = await this.db.query.invoices.findMany({
      where: eq(schema.invoices.userId, userId),
      orderBy: [desc(schema.invoices.issuedAt)],
    });

    const kycRecord = await this.db.query.kyc.findFirst({
      where: eq(schema.kyc.userId, userId),
      orderBy: [desc(schema.kyc.submittedAt)],
    });

    const companyProfile = await this.db.query.customerCompanyProfile.findFirst({
      where: eq(schema.customerCompanyProfile.userId, userId),
    });

    const activities = await this.db.query.activityLogs.findMany({
      where: eq(schema.activityLogs.userId, userId),
      orderBy: [desc(schema.activityLogs.createdAt)],
      limit: 20,
    });

    // Map KYC status label
    let kycStatusLabel = 'NOT_STARTED';
    if (kycRecord) {
      if (kycRecord.status === 'approved') kycStatusLabel = 'APPROVED';
      else if (kycRecord.status === 'rejected') kycStatusLabel = 'REJECTED';
      else if (kycRecord.status === 'resubmission_required') kycStatusLabel = 'RESUBMISSION_REQUIRED';
      else if (kycRecord.status === 'pending') kycStatusLabel = 'UNDER_REVIEW';
    }

    return {
      accountInfo: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || kycRecord?.businessPhone || companyProfile?.contactPhone || '—',
        businessName: user.businessName || kycRecord?.businessName || companyProfile?.businessName || '—',
        country: user.country || kycRecord?.country || companyProfile?.country || '—',
        profileImage: user.profileImage || null,
        role: user.role,
        accountStatus: user.accountStatus,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        registeredAt: user.registeredAt || user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt,
        firstLoginAt: user.firstLoginAt,
        lastLoginAt: user.lastLoginAt,
        suspendedAt: user.suspendedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      businessInfo: {
        businessName: user.businessName || kycRecord?.businessName || companyProfile?.businessName || '—',
        businessType: kycRecord?.businessType || '—',
        businessAddress: kycRecord?.businessAddress || companyProfile?.addressLine1 || '—',
        website: companyProfile?.website || '—',
        businessEmail: kycRecord?.businessEmail || companyProfile?.contactEmail || user.email,
        businessPhone: kycRecord?.businessPhone || companyProfile?.contactPhone || user.phoneNumber || '—',
        businessDescription: kycRecord?.businessDescription || companyProfile?.businessDescription || '—',
        registrationNumber: kycRecord?.registrationNumber || '—',
        country: kycRecord?.country || user.country || companyProfile?.country || '—',
      },
      kyc: kycRecord
        ? {
            id: kycRecord.id,
            status: kycRecord.status,
            kycStatusLabel,
            submittedAt: kycRecord.submittedAt,
            reviewedAt: kycRecord.reviewedAt,
            reviewedBy: kycRecord.reviewedBy,
            rejectionReason: kycRecord.rejectionReason,
            documents: {
              certOfRegistration: {
                path: kycRecord.certOfRegistrationPath,
                originalName: kycRecord.certOfRegistrationOriginalName,
                mimeType: kycRecord.certOfRegistrationMimeType,
                fileSize: kycRecord.certOfRegistrationFileSize,
                uploadedAt: kycRecord.certOfRegistrationUploadedAt,
                status: kycRecord.certOfRegistrationStatus,
                rejectionReason: kycRecord.certOfRegistrationRejectionReason,
              },
              utilityBill: {
                path: kycRecord.utilityBillPath,
                originalName: kycRecord.utilityBillOriginalName,
                mimeType: kycRecord.utilityBillMimeType,
                fileSize: kycRecord.utilityBillFileSize,
                uploadedAt: kycRecord.utilityBillUploadedAt,
                status: kycRecord.utilityBillStatus,
                rejectionReason: kycRecord.utilityBillRejectionReason,
              },
              ownerId: {
                path: kycRecord.ownerIdPath,
                originalName: kycRecord.ownerIdOriginalName,
                mimeType: kycRecord.ownerIdMimeType,
                fileSize: kycRecord.ownerIdFileSize,
                uploadedAt: kycRecord.ownerIdUploadedAt,
                status: kycRecord.ownerIdStatus,
                rejectionReason: kycRecord.ownerIdRejectionReason,
              },
            },
          }
        : null,
      subscription: {
        planName: activeSub?.plan?.name || 'Free',
        price: activeSub?.plan?.price || 0,
        status: activeSub?.status || 'active',
        currentPeriodStart: activeSub?.currentPeriodStart || null,
        currentPeriodEnd: activeSub?.currentPeriodEnd || null,
        plan: activeSub?.plan || null,
        invoices: userInvoices,
        payments: userPayments,
      },
      accountManager: user.accountManager
        ? {
            id: user.accountManager.id,
            name: user.accountManager.fullName,
            email: user.accountManager.email,
            role: user.accountManager.role,
          }
        : null,
      activities,
    };
  }

  /**
   * Admin creates a new user account directly.
   */
  async createUser(dto: {
    fullName: string;
    email: string;
    password?: string;
    businessName?: string;
    phoneNumber?: string;
    country?: string;
    role?: UserRole;
    accountStatus?: 'ACTIVE' | 'EMAIL_VERIFICATION_PENDING';
    accountManagerId?: string;
  }) {
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordToHash = dto.password || 'SocialPilot@2026!';
    const passwordHash = await bcrypt.hash(passwordToHash, SALT_ROUNDS);
    const now = new Date();
    const isVerified = dto.accountStatus === 'ACTIVE';

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        businessName: dto.businessName ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        country: dto.country ?? null,
        role: dto.role || UserRole.USER,
        accountStatus: dto.accountStatus || 'EMAIL_VERIFICATION_PENDING',
        isActive: true,
        isEmailVerified: isVerified,
        emailVerifiedAt: isVerified ? now : null,
        accountManagerId: dto.accountManagerId ?? null,
        registeredAt: now,
      })
      .returning();

    // Assign default free plan if none exists
    const freePlan = await this.db.query.plans.findFirst({
      where: eq(schema.plans.slug, 'free'),
    });
    if (freePlan) {
      await this.db.insert(schema.subscriptions).values({
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
      });
    }

    await this.activityLogsService.record({
      userId: user.id,
      userName: user.fullName,
      action: 'ADMIN_CREATED_USER',
      module: 'user_management',
      description: `Admin created user account: ${user.email}`,
    });

    return user;
  }

  /**
   * Admin edits an existing user account.
   */
  async updateUser(
    userId: string,
    dto: {
      fullName?: string;
      businessName?: string;
      phoneNumber?: string;
      country?: string;
      role?: UserRole;
      accountManagerId?: string;
    },
  ) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatePayload: any = { updatedAt: new Date() };
    if (dto.fullName !== undefined) updatePayload.fullName = dto.fullName;
    if (dto.businessName !== undefined) updatePayload.businessName = dto.businessName;
    if (dto.phoneNumber !== undefined) updatePayload.phoneNumber = dto.phoneNumber;
    if (dto.country !== undefined) updatePayload.country = dto.country;
    if (dto.role !== undefined) updatePayload.role = dto.role;
    if (dto.accountManagerId !== undefined) updatePayload.accountManagerId = dto.accountManagerId || null;

    const [updated] = await this.db
      .update(schema.users)
      .set(updatePayload)
      .where(eq(schema.users.id, userId))
      .returning();

    await this.activityLogsService.record({
      userId,
      userName: updated.fullName,
      action: 'ADMIN_UPDATED_USER',
      module: 'user_management',
      description: `Admin updated user information for ${updated.email}`,
    });

    return updated;
  }

  /**
   * Suspends or reactivates a user account.
   */
  async suspendUser(userId: string, suspend: boolean) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const newStatus = suspend ? 'SUSPENDED' : (user.isEmailVerified ? 'ACTIVE' : 'EMAIL_VERIFICATION_PENDING');

    await this.db
      .update(schema.users)
      .set({
        accountStatus: newStatus as any,
        isActive: !suspend,
        suspendedAt: suspend ? now : null,
        updatedAt: now,
      })
      .where(eq(schema.users.id, userId));

    await this.activityLogsService.record({
      userId,
      userName: user.fullName,
      action: suspend ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      module: 'user_management',
      description: suspend
        ? `Admin suspended user account: ${user.email}`
        : `Admin activated user account: ${user.email}`,
    });

    return { success: true, accountStatus: newStatus, isActive: !suspend };
  }

  /**
   * Soft deletes a user account safely.
   */
  async deleteUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.activityLogsService.record({
      userId: null,
      userName: user.fullName,
      action: 'USER_DELETED',
      module: 'user_management',
      description: `Admin soft-deleted user account: ${user.email}`,
    });

    await this.db
      .update(schema.users)
      .set({
        accountStatus: 'DELETED',
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    return { success: true };
  }

  /**
   * Assigns an account manager to a customer user.
   */
  async assignAccountManager(userId: string, accountManagerId: string | null) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    if (accountManagerId) {
      const manager = await this.db.query.users.findFirst({
        where: eq(schema.users.id, accountManagerId),
      });
      if (!manager) throw new NotFoundException('Account Manager not found');
    }

    await this.db
      .update(schema.users)
      .set({
        accountManagerId: accountManagerId || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    await this.activityLogsService.record({
      userId,
      userName: user.fullName,
      action: 'ACCOUNT_MANAGER_ASSIGNED',
      module: 'user_management',
      description: `Assigned account manager to user: ${user.email}`,
    });

    return { success: true };
  }

  /**
   * Updates user's profile image.
   */
  async updateProfileImage(userId: string, profileImagePath: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    const [updated] = await this.db
      .update(schema.users)
      .set({
        profileImage: profileImagePath,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    return { success: true, profileImage: updated.profileImage };
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
      orderBy: [desc(schema.subscriptions.createdAt)],
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
      orderBy: [desc(schema.payments.createdAt)],
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
}
