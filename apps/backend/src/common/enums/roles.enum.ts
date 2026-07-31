export enum UserRole {
  USER = 'user',
  SUPER_ADMIN = 'super_admin',
  ACCOUNT_MANAGER = 'account_manager',
  REVIEWER = 'reviewer',
  DESIGNER = 'designer',
}

export const ALL_ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ACCOUNT_MANAGER,
  UserRole.REVIEWER,
  UserRole.DESIGNER,
];

export const MANAGEMENT_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ACCOUNT_MANAGER,
];

export const FINANCIAL_ROLES = [
  UserRole.SUPER_ADMIN,
];
