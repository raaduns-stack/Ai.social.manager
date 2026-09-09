import { pgTable, uuid, varchar, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { UserRole } from '../../common/enums/roles.enum';

export const roleEnum = pgEnum('role', [
  UserRole.USER,
  UserRole.SUPER_ADMIN,
  UserRole.ACCOUNT_MANAGER,
  UserRole.REVIEWER,
  UserRole.SUPPORT_STAFF,
  UserRole.DESIGNER,
]);

export const accountStatusEnum = pgEnum('account_status', [
  'EMAIL_VERIFICATION_PENDING',
  'REGISTRATION_IN_PROGRESS',
  'ACTIVE',
  'SUSPENDED',
  'DELETED',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  country: varchar('country', { length: 100 }),
  profileImage: varchar('profile_image', { length: 500 }),
  role: roleEnum('role').notNull().default(UserRole.USER),
  accountStatus: accountStatusEnum('account_status').notNull().default('EMAIL_VERIFICATION_PENDING'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerificationCode: varchar('email_verification_code', { length: 6 }),
  emailVerificationExpiresAt: timestamp('email_verification_expires_at'),
  accountManagerId: uuid('account_manager_id'),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
  emailVerifiedAt: timestamp('email_verified_at'),
  firstLoginAt: timestamp('first_login_at'),
  lastLoginAt: timestamp('last_login_at'),
  suspendedAt: timestamp('suspended_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

