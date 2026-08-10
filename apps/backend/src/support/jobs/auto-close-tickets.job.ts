import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { eq, and, lt } from 'drizzle-orm';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class AutoCloseTicketsJob {
  private readonly logger = new Logger(AutoCloseTicketsJob.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running auto-close-tickets job...');
    
    // Calculate timestamp for 72 hours ago
    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

    try {
      const ticketsToClose = await this.db.query.supportTickets.findMany({
        where: and(
          eq(schema.supportTickets.status, 'resolved'),
          lt(schema.supportTickets.resolvedAt, seventyTwoHoursAgo)
        ),
        columns: {
          id: true,
        },
      });

      if (ticketsToClose.length === 0) {
        this.logger.debug('No tickets to auto-close.');
        return;
      }

      this.logger.log(`Found ${ticketsToClose.length} resolved ticket(s) older than 72 hours. Closing them...`);

      const ids = ticketsToClose.map(t => t.id);

      // Perform updates sequentially or use IN clause (Drizzle inArray)
      // Since it's potentially large, we can loop or use a single update query.
      for (const id of ids) {
        await this.db
          .update(schema.supportTickets)
          .set({ status: 'closed', updatedAt: new Date() })
          .where(eq(schema.supportTickets.id, id));
      }

      this.logger.log(`Successfully closed ${ticketsToClose.length} ticket(s).`);
    } catch (error) {
      this.logger.error('Failed to auto-close tickets', error);
    }
  }
}
