import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PlansService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findAll() {
    return this.db.query.plans.findMany({
      where: eq(schema.plans.isActive, true),
    });
  }

  async findById(id: string) {
    const plan = await this.db.query.plans.findFirst({
      where: eq(schema.plans.id, id),
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async findBySlug(slug: string) {
    return this.db.query.plans.findFirst({
      where: eq(schema.plans.slug, slug),
    });
  }
}
