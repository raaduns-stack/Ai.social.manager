import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  /** Return the logged-in user's current subscription with plan details. */
  async findByUserId(userId: string) {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId),
      with: { plan: true },
    });
    if (!subscription) {
      throw new NotFoundException('No subscription found for this user');
    }
    return subscription;
  }

  /** Create a new "pending" subscription (activated later by Payments module). */
  async create(userId: string, planId: string) {
    // Verify the plan exists and is active
    const plan = await this.db.query.plans.findFirst({
      where: and(eq(schema.plans.id, planId), eq(schema.plans.isActive, true)),
    });
    if (!plan) {
      throw new NotFoundException('Plan not found or is no longer active');
    }

    const [subscription] = await this.db
      .insert(schema.subscriptions)
      .values({
        userId,
        planId,
        status: 'pending',
      })
      .returning();

    return subscription;
  }

  /** Cancel the user's current subscription. */
  async cancel(userId: string) {
    const existing = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, 'active'),
      ),
    });
    if (!existing) {
      throw new NotFoundException('No active subscription to cancel');
    }

    const [updated] = await this.db
      .update(schema.subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, existing.id))
      .returning();

    return updated;
  }
}
