import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, count, inArray } from 'drizzle-orm';

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
  // TOGGLE AI PROMPT STATUS
  // Enables or disables a prompt template.
  // ==================================================
  async togglePrompt(id: string) {
    const [existingPrompt] = await this.db
      .select()
      .from(schema.aiPromptTemplates)
      .where(eq(schema.aiPromptTemplates.id, id));

    if (!existingPrompt) {
      return null;
    }

    const [updatedPrompt] = await this.db
      .update(schema.aiPromptTemplates)
      .set({
        isActive: !existingPrompt.isActive,
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

  // ==================================================
  // AI FEEDBACK ANALYTICS
  // Computes aggregate feedback stats for admin view.
  // ==================================================
  async getFeedbackAnalytics() {
    const allFeedback = await this.db
      .select()
      .from(schema.contentFeedback);

    const totalFeedback = allFeedback.length;
    const upReactions = allFeedback.filter((f) => f.reaction === 'up').length;
    const downReactions = allFeedback.filter((f) => f.reaction === 'down').length;

    const approvalRate = totalFeedback > 0 
      ? Number(((upReactions / totalFeedback) * 100).toFixed(1)) 
      : 0;

    const totalRatingSum = allFeedback.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = totalFeedback > 0 
      ? Number((totalRatingSum / totalFeedback).toFixed(1)) 
      : 0;

    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allFeedback.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
      }
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
      const cnt = ratingCounts[stars] || 0;
      const percentage = totalFeedback > 0 
        ? Math.round((cnt / totalFeedback) * 100) 
        : 0;
      return { stars, count: cnt.toLocaleString(), percentage };
    });

    const [suggestionsCountRes] = await this.db
      .select({ count: count() })
      .from(schema.contentSuggestions);

    return {
      totalSuggestions: suggestionsCountRes?.count || 0,
      totalFeedback,
      upReactions,
      downReactions,
      approvalRate,
      avgRating,
      ratingDistribution,
    };
  }

  // ==================================================
  // CUSTOMER AI FEEDBACK ANALYTICS
  // Computes feedback stats grouped by each customer.
  // ==================================================
  async getCustomerFeedbackAnalytics(page: number, limit: number) {
    // 1. Get distinct user IDs from content suggestions
    const usersWithSuggestions = await this.db
      .selectDistinct({ userId: schema.contentSuggestions.userId })
      .from(schema.contentSuggestions);

    // 2. Get distinct user IDs from content feedback
    const usersWithFeedback = await this.db
      .selectDistinct({ userId: schema.contentFeedback.userId })
      .from(schema.contentFeedback);

    const activeUserIdsSet = new Set<string>();
    for (const row of usersWithSuggestions) {
      if (row.userId) activeUserIdsSet.add(row.userId);
    }
    for (const row of usersWithFeedback) {
      if (row.userId) activeUserIdsSet.add(row.userId);
    }

    const activeUserIds = Array.from(activeUserIdsSet);
    const total = activeUserIds.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedUserIds = activeUserIds.slice(start, start + limit);

    if (paginatedUserIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }

    // 3. Retrieve users only in the paginated subset
    const usersList = await this.db
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        businessName: schema.users.businessName,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(inArray(schema.users.id, paginatedUserIds));

    // 4. Retrieve suggestions count only for this subset
    const suggestionCounts = await this.db
      .select({
        userId: schema.contentSuggestions.userId,
        count: count(),
      })
      .from(schema.contentSuggestions)
      .where(inArray(schema.contentSuggestions.userId, paginatedUserIds))
      .groupBy(schema.contentSuggestions.userId);

    const sugMap = new Map<string, number>();
    for (const row of suggestionCounts) {
      if (row.userId) {
        sugMap.set(row.userId, row.count);
      }
    }

    // 5. Retrieve feedback records only for this subset
    const feedbacks = await this.db
      .select({
        id: schema.contentFeedback.id,
        userId: schema.contentFeedback.userId,
        rating: schema.contentFeedback.rating,
        reaction: schema.contentFeedback.reaction,
        suggestionTitle: schema.contentSuggestions.title,
        suggestionContent: schema.contentSuggestions.content,
      })
      .from(schema.contentFeedback)
      .leftJoin(
        schema.contentSuggestions,
        eq(schema.contentFeedback.suggestionId, schema.contentSuggestions.id)
      )
      .where(inArray(schema.contentFeedback.userId, paginatedUserIds));

    const feedbackMap = new Map<string, typeof feedbacks>();
    for (const row of feedbacks) {
      if (row.userId) {
        const list = feedbackMap.get(row.userId) || [];
        list.push(row);
        feedbackMap.set(row.userId, list);
      }
    }

    const analytics = [];
    for (const u of usersList) {
      const totalSuggestions = sugMap.get(u.id) || 0;
      const userFeedbacks = feedbackMap.get(u.id) || [];
      const totalRatings = userFeedbacks.length;

      const ratings = userFeedbacks.map((f) => f.rating);
      const avgRating = totalRatings > 0
        ? Number((ratings.reduce((sum, r) => sum + r, 0) / totalRatings).toFixed(1))
        : 0;

      const likes = userFeedbacks.filter((f) => f.reaction === 'up').length;
      const dislikes = userFeedbacks.filter((f) => f.reaction === 'down').length;

      const preferredTopicsList = userFeedbacks
        .filter((f) => f.rating >= 3 || f.reaction === 'up')
        .map((f) => f.suggestionTitle || f.suggestionContent?.substring(0, 30) || 'AI Post')
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 3);

      const preferredTopics = preferredTopicsList.length > 0
        ? preferredTopicsList.join(', ')
        : 'None';

      const perfRatio = totalRatings > 0 ? Math.round((likes / totalRatings) * 100) : 0;
      const suggestionPerformance = totalRatings > 0
        ? `${perfRatio}% positive (${likes}/${totalRatings} rated)`
        : 'No ratings yet';

      analytics.push({
        userId: u.id,
        fullName: u.fullName,
        businessName: u.businessName,
        email: u.email,
        totalSuggestions,
        totalRatings,
        avgRating,
        likes,
        dislikes,
        preferredTopics,
        suggestionPerformance,
      });
    }

    return {
      data: analytics,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}