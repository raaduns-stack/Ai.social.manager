import { Inject, Injectable } from '@nestjs/common';
import { count, eq, gte, and, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DashboardService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getSummary(period: string = 'weekly') {
    const now = new Date();
    const startDate = new Date();

    if (period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'monthly') {
      startDate.setDate(now.getDate() - 30);
    } else {
      // Default to weekly (7 days)
      startDate.setDate(now.getDate() - 7);
    }

    // 1. Total Customers (total rows in users)
    const [totalCustomersRes] = await this.db.select({ val: count() }).from(schema.users);

    // 2. New Customers This Period
    const [newCustomersRes] = await this.db
      .select({ val: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, startDate));

    // 3. Active Subscriptions
    const [activeSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));

    // 4. Expired Subscriptions
    const [expiredSubsRes] = await this.db
      .select({ val: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'expired'));
    
    // 5. Total AI Suggestions
const [suggestionsRes] = await this.db
  .select({ val: count() })
  .from(schema.contentSuggestions);

// 6. Total Feedback
const [feedbackRes] = await this.db
  .select({ val: count() })
  .from(schema.contentFeedback);

    // 7. Revenue This Period (sum of successful payments converted from kobo to naira)
    const [revenueRes] = await this.db
      .select({ val: sum(schema.payments.amount) })
      .from(schema.payments)
      .where(
        and(eq(schema.payments.status, 'successful'), gte(schema.payments.createdAt, startDate)),
      );

    const revenueKobo = Number(revenueRes?.val || 0);
    const revenueNaira = revenueKobo / 100;

    return {
  totalCustomers: totalCustomersRes?.val || 0,
  newCustomersThisPeriod: newCustomersRes?.val || 0,
  activeSubscriptions: activeSubsRes?.val || 0,
  expiredSubscriptions: expiredSubsRes?.val || 0,
  revenueThisPeriod: revenueNaira,
  totalSuggestions: suggestionsRes?.val || 0,
  totalFeedback: feedbackRes?.val || 0,
};
  }
}
