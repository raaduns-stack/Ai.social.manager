import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class InvoicesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Return all invoices for the logged-in user. */
  async findAllByUser(userId: string) {
    return this.db.query.invoices.findMany({
      where: eq(schema.invoices.userId, userId),
      with: {
        payment: true,
        subscription: true,
      },
    });
  }

  /** Return a single invoice detail by ID for the logged-in user. */
  async findOneByUser(id: string, userId: string) {
    const invoice = await this.db.query.invoices.findFirst({
      where: and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId)),
      with: {
        payment: true,
        subscription: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
