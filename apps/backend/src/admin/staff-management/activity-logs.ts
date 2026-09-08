export interface LoginHistoryRecord {
  id: string;
  userId: string;
  userEmail: string;
  userType: 'ADMIN' | 'STAFF';
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  loggedAt: Date;
}

export interface LoginHistoryQueryFilters {
  userId?: string;
  userType?: 'ADMIN' | 'STAFF';
  status?: 'SUCCESS' | 'FAILED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface LoginHistoryRepository {
  recordLogin(entry: Omit<LoginHistoryRecord, 'id' | 'loggedAt'>): Promise<LoginHistoryRecord>;
  findHistory(
    filters: LoginHistoryQueryFilters,
    skip: number,
    limit: number
  ): Promise<{ data: LoginHistoryRecord[]; total: number }>;
}

export class LoginHistoryService {
  constructor(private readonly repo: LoginHistoryRepository) {}

  async logLoginAttempt(
    data: Omit<LoginHistoryRecord, 'id' | 'loggedAt'>
  ): Promise<LoginHistoryRecord> {
    return this.repo.recordLogin(data);
  }

  async getLoginHistory(filters: LoginHistoryQueryFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const skip = (page - 1) * limit;

    const { data, total } = await this.repo.findHistory(filters, skip, limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}