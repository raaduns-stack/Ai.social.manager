import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
// Type alias for the strongly-typed Drizzle PostgreSQL database client instance
type Database = PostgresJsDatabase<typeof schema>;
/**
 * Service encapsulating business logic for content suggestion generation,
 * retrieving user-specific history, and recording feedback metrics in PostgreSQL.
 */
@Injectable()
export class ContentSuggestionsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) { }
  /**
   * Fetches all generated content suggestions for a given user,
   * sorted by creation date in descending order (newest first).
   */
  async findAll(userId: string) {
    const suggestions =
      await this.db.query.contentSuggestions.findMany({
        where: eq(schema.contentSuggestions.userId, userId),
        orderBy: desc(schema.contentSuggestions.createdAt),
        with: {
          feedback: {
            where: eq(schema.contentFeedback.userId, userId),
            orderBy: desc(schema.contentFeedback.createdAt),
            limit: 1,
          },
        },
      });

    return suggestions.map((suggestion) => {
      const feedback = suggestion.feedback?.[0] ?? null;

      return {
        ...suggestion,
        feedback: feedback
          ? {
            reaction: feedback.reaction,
            rating: feedback.rating,
          }
          : null,
      };
    });
  }

  /**
     * Generates a template caption and relevant hashtags for a business type,
     * persists the generated suggestion to the database, and returns the stored result.
     */
  async generateCaption(userId: string, businessType: string) {
    // Construct mock caption string and format hashtag array (removes spaces from business type)
    const caption = `Grow your ${businessType} with amazing content today!`;

    const hashtags = [
      '#AI',
      '#Marketing',
      `#${businessType.replace(/\s+/g, '')}`,
    ];

    // Persist new caption record into database
    const [suggestion] = await this.db
      .insert(schema.contentSuggestions)
      .values({
        userId,
        type: 'caption',
        content: caption,
        hashtags,
      })
      .returning();

    return {
      id: suggestion.id,
      caption: suggestion.content,
      hashtags: suggestion.hashtags,
    };
  }

  /**
   * Generates a template marketing idea for a given business type,
   * persists the record, and returns the created suggestion.
   */
  async generateIdea(userId: string, businessType: string) {
    const idea = `Share a customer success story about your ${businessType}.`;

    // Persist new idea record into database
    const [suggestion] = await this.db
      .insert(schema.contentSuggestions)
      .values({
        userId,
        type: 'idea',
        content: idea,
      })
      .returning();

    return {
      id: suggestion.id,
      idea: suggestion.content,
    };
  }

  /**
   * Inserts a user feedback record (rating & reaction) associated with a specific content suggestion.

   */
  async saveFeedback(
    suggestionId: string,
    userId: string,
    reaction: 'up' | 'down',
    rating: number,
  ) {
    // Make sure the suggestion belongs to the logged-in user.
    const suggestion = await this.db.query.contentSuggestions.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.id, suggestionId),
          eq(fields.userId, userId),
        ),
    })

    if (!suggestion) {
      throw new NotFoundException('Content suggestion not found')
    }

    // Check whether this user has already rated this suggestion.
    const existingFeedback =
      await this.db.query.contentFeedback.findFirst({
        where: (fields, { and, eq }) =>
          and(
            eq(fields.suggestionId, suggestionId),
            eq(fields.userId, userId),
          ),
      })

    // Update existing feedback instead of creating duplicates.
    if (existingFeedback) {
      const [updatedFeedback] = await this.db
        .update(schema.contentFeedback)
        .set({
          reaction,
          rating,
        })
        .where(eq(schema.contentFeedback.id, existingFeedback.id))
        .returning()

      return updatedFeedback
    }

    // Create the first feedback record.
    const [feedback] = await this.db
      .insert(schema.contentFeedback)
      .values({
        suggestionId,
        userId,
        reaction,
        rating,
      })
      .returning()

    return feedback
  }
}