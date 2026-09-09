export type AccountStatus = 'ENABLED' | 'DISABLED';

export interface UserStatusChangeRecord {
  userId: string;
  status: AccountStatus;
  reason: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface EnableDisableUserRepository {
  findUserById(userId: string): Promise<{ id: string; isEnabled: boolean } | null>;
  updateUserStatus(userId: string, isEnabled: boolean): Promise<void>;
  logStatusChange(record: UserStatusChangeRecord): Promise<void>;
}

export class EnableDisableUserService {
  constructor(private readonly repo: EnableDisableUserRepository) {}

  async setAccountStatus(
    userId: string,
    targetStatus: AccountStatus,
    reason: string,
    adminId: string
  ): Promise<UserStatusChangeRecord> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist.`);
    }

    const shouldEnable = targetStatus === 'ENABLED';

    if (user.isEnabled === shouldEnable) {
      throw new Error(`User account is already ${targetStatus.toLowerCase()}.`);
    }

    await this.repo.updateUserStatus(userId, shouldEnable);

    const record: UserStatusChangeRecord = {
      userId,
      status: targetStatus,
      reason,
      updatedBy: adminId,
      updatedAt: new Date(),
    };

    await this.repo.logStatusChange(record);
    return record;
  }
}