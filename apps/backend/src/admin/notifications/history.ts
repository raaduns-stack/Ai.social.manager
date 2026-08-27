export interface HistoryQueryFilters {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'ANNOUNCEMENT' | 'SUBSCRIPTION' | 'APPROVAL' | 'PUBLISHING' | 'MAINTENANCE';
  status?: 'SENT' | 'FAILED' | 'PENDING';
  startDate?: Date;
  endDate?: Date;
}

export interface HistoryRepository {
  findNotifications: (
    filters: HistoryQueryFilters,
    skip: number,
    limit: number
  ) => Promise<any[]>;
  countNotifications: (filters: HistoryQueryFilters) => Promise<number>;
}

export async function getNotificationHistory(
  filters: HistoryQueryFilters = {},
  repository: HistoryRepository
) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    repository.findNotifications(filters, skip, limit),
    repository.countNotifications(filters),
  ]);

  return {
    data: records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}