// transaction-management.ts

import { PaymentStatus } from './payment-analytics';

/**
 * Interface matching your actual Database Transaction Document / Table
 */
export interface Transaction {
    id: string;
    customerId: string;
    customerEmail: string;
    customerName?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: string;
    paymentGatewayRef: string;
    description: string;
    planId?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
}

export interface TransactionQueryFilters {
    searchQuery?: string;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    paymentMethod?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedTransactionsResponse {
    transactions: Transaction[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface IssueResolutionRequest {
    transactionId: string;
    action: 'mark_verified' | 'flag_dispute';
    reason: string;
    adminUserId: string;
}

/**
 * Service for live database queries
 */
export class TransactionManagementService {
    // Inject your database model/repository here (e.g., Mongoose Model or Prisma Client)
    constructor(private readonly dbContext: any) { }

    /**
     * Fetches real paginated transactions from your database
     */
    async getTransactions(filters: TransactionQueryFilters): Promise<PaginatedTransactionsResponse> {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        // Construct live query filter object
        const query: Record<string, any> = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.paymentMethod) {
            query.paymentMethod = filters.paymentMethod;
        }

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) query.createdAt.$gte = filters.startDate;
            if (filters.endDate) query.createdAt.$lte = filters.endDate;
        }

        if (filters.searchQuery) {
            query.$or = [
                { customerEmail: { $regex: filters.searchQuery, $options: 'i' } },
                { customerName: { $regex: filters.searchQuery, $options: 'i' } },
                { paymentGatewayRef: filters.searchQuery },
            ];
        }

        // Execute parallel live database queries
        const [transactions, totalCount] = await Promise.all([
            this.dbContext.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
            this.dbContext.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            transactions,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }

    /**
     * Fetches a single transaction by ID directly from the database
     */
    async getTransactionById(transactionId: string): Promise<Transaction | null> {
        return await this.dbContext.findById(transactionId);
    }

    /**
     * Processes live status updates in the database
     */
    async resolveTransactionIssue(
        request: IssueResolutionRequest
    ): Promise<{ success: boolean; updatedTransaction: Transaction }> {
        const transaction = await this.dbContext.findById(request.transactionId);

        if (!transaction) {
            throw new Error(`Transaction with ID ${request.transactionId} not found.`);
        }

        // Persist real updates to database
        const updatedTransaction = await this.dbContext.findByIdAndUpdate(
            request.transactionId,
            {
                $set: {
                    status: transaction.status,
                    updatedAt: new Date(),
                    'metadata.lastIssueResolution': {
                        action: request.action,
                        reason: request.reason,
                        resolvedBy: request.adminUserId,
                        resolvedAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        return {
            success: true,
            updatedTransaction,
        };
    }
}