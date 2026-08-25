import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, desc, and, or, ilike, sum, count, ne, isNull, inArray } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as bcrypt from 'bcrypt';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { seedPlans as runPlansSeeding } from '../database/seeding';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserRole, ALL_ADMIN_ROLES } from '../common/enums/roles.enum';
import { CreateStaffDto } from './dto/create-staff.dto';

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
        where: and(
          eq(schema.subscriptions.userId, u.id),
          eq(schema.subscriptions.status, 'active'),
        ),
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
      const planSlug = activeSub?.plan?.slug || 'free';
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
        planSlug: planSlug,
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
    const allSuccessfulPayments = await this.db.query.payments.findMany({
      where: eq(schema.payments.status, 'successful'),
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

    const paidUsersSet = new Set<string>();
    for (const p of allSuccessfulPayments) {
      paidUsersSet.add(p.userId);
    }
    for (const s of allSubs) {
      if (s.status === 'active' && s.plan && s.plan.slug !== 'free') {
        paidUsersSet.add(s.userId);
      }
    }

    for (const u of allUsers) {
      if (u.role !== UserRole.USER) continue;
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

      const isPaid = paidUsersSet.has(u.id);
      if (isPaid) {
        paidUsers++;
      } else {
        freeUsers++;
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
      where: and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, 'active'),
      ),
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

    const userSocialAccounts = await this.db.query.social_accounts.findMany({
      where: eq(schema.social_accounts.userId, userId),
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
        planSlug: activeSub?.plan?.slug || 'free',
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
      activities: activities.map((al) => ({
        id: al.id,
        title: al.action,
        description: al.description,
        time: al.createdAt,
      })),
      socialAccounts: userSocialAccounts.map((sa) => ({
        id: sa.id,
        platform: sa.platform,
        accountHandle: sa.accountHandle,
        status: sa.status === 'connected' ? 'Connected' : 'Disconnected',
        connectedAt: sa.connectedAt,
      })),
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
      .innerJoin(schema.plans, eq(schema.subscriptions.planId, schema.plans.id))
      .where(and(eq(schema.subscriptions.status, 'active'), ne(schema.plans.slug, 'free')));

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
