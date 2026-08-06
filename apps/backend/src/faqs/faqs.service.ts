import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class FaqsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  // ---------------------------------------------------------------------------
  // Public Operations
  // ---------------------------------------------------------------------------

  async getPublishedFaqs() {
    return await this.db.query.faqs.findMany({
      where: eq(schema.faqs.isPublished, true),
      orderBy: [asc(schema.faqs.displayOrder)],
    });
  }

  // ---------------------------------------------------------------------------
  // Admin Operations
  // ---------------------------------------------------------------------------

  async getAllFaqsForAdmin() {
    return await this.db.query.faqs.findMany({
      orderBy: [asc(schema.faqs.displayOrder)],
    });
  }

  async createFaq(dto: CreateFaqDto) {
    const [faq] = await this.db
      .insert(schema.faqs)
      .values({
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        isPublished: dto.isPublished ?? false,
        displayOrder: dto.displayOrder ?? 0,
      })
      .returning();

    return faq;
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const [faq] = await this.db
      .update(schema.faqs)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(schema.faqs.id, id))
      .returning();

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async deleteFaq(id: string) {
    const [faq] = await this.db
      .delete(schema.faqs)
      .where(eq(schema.faqs.id, id))
      .returning();

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return { deleted: true, id };
  }
}
