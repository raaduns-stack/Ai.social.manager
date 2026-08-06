import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { CreatePromptDto } from './dto/create-prompt.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PromptManagementService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  // ==================================================
  // GET ALL AI PROMPT TEMPLATES
  // This returns every prompt stored in the database.
  // ==================================================
  async getAllPrompts() {
    return await this.db
      .select()
      .from(schema.aiPromptTemplates);
  }
    // ==================================================
  // CREATE A NEW AI PROMPT TEMPLATE
  // Inserts a new prompt into the database.
  // ==================================================
  async createPrompt(createPromptDto: CreatePromptDto) {
    const [prompt] = await this.db
      .insert(schema.aiPromptTemplates)
      .values({
        name: createPromptDto.name,
        category: createPromptDto.category,
        prompt: createPromptDto.prompt,
        isActive: createPromptDto.isActive ?? true,
      })
      .returning();

    return prompt;
  }
  // ==================================================
// UPDATE AN AI PROMPT TEMPLATE
// Allows the admin to modify an existing prompt.
// ==================================================
async updatePrompt(
  id: string,
  data: {
    name?: string;
    category?: string;
    prompt?: string;
    isActive?: boolean;
  },
) {
  const [updatedPrompt] = await this.db
    .update(schema.aiPromptTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.aiPromptTemplates.id, id))
    .returning();

  return updatedPrompt;
}
// ==================================================
// DELETE AN AI PROMPT TEMPLATE
// Removes a prompt permanently from the database.
// ==================================================
async deletePrompt(id: string) {
  const [deletedPrompt] = await this.db
    .delete(schema.aiPromptTemplates)
    .where(eq(schema.aiPromptTemplates.id, id))
    .returning();

  return deletedPrompt;
}
}