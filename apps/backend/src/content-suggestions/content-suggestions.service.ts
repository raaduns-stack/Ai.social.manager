import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { desc, eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class ContentSuggestionsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  /**
   * Fetches all generated content suggestions for a given user,
   * sorted by creation date in descending order (newest first).
   */
  async findAll(userId: string) {
    const suggestions = await this.db.query.contentSuggestions.findMany({
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
    const caption = `Grow your ${businessType} with amazing content today!`;

    const hashtags = [
      '#AI',
      '#Marketing',
      `#${businessType.replace(/\s+/g, '')}`,
    ];

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
   * Records a user's reaction (up/down) and score rating for a specific content suggestion.
   * Enforces that ratings are final and cannot be modified.
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
    });

    if (!suggestion) {
      throw new NotFoundException('Content suggestion not found');
    }

    // Check whether this user has already rated this suggestion.
    const existingFeedback = await this.db.query.contentFeedback.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.suggestionId, suggestionId),
          eq(fields.userId, userId),
        ),
    });

    // Rating is final! Enforce this on the backend.
    if (existingFeedback) {
      throw new BadRequestException('Feedback has already been submitted for this suggestion and cannot be modified.');
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
      .returning();

    return feedback;
  }

  /**
   * Fetch AI suggestions generated for a specific calendar post.
   * If none exist, automatically generates 4 suggestions.
   */
  async findForPost(postId: string, userId: string) {
    const post = await this.db.query.contentCalendar.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.id, postId),
          eq(fields.userId, userId),
        ),
    });

    if (!post) {
      throw new NotFoundException('Calendar post not found.');
    }

    const existing = await this.db.query.contentSuggestions.findMany({
      where: eq(schema.contentSuggestions.postId, postId),
      with: {
        feedback: {
          where: eq(schema.contentFeedback.userId, userId),
          limit: 1,
        },
      },
    });

    if (existing && existing.length > 0) {
      return existing.map((suggestion) => {
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

    // Generate 4 mock suggestions tailored to the post's topic (title) and platform
    const platformStr = post.platform.replace(/\s+/g, '');
    const cleanTopic = post.title.replace(/[^\w]/g, '').substring(0, 30);
    
    const variations = [
      {
        title: `5 Steps to Automate Your ${post.title}`,
        content: `Want to master ${post.title}? Here are 5 simple steps we use to automate the entire workflow and save hours of manual labor. Which one are you trying first? 👇`,
        hashtags: ['#automation', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `Why 'Quantity' is No Longer King in ${post.title}`,
        content: `Stop chasing the algorithm when it comes to ${post.title}. Focus on high-intent quality content that converts readers into buyers. Here is why focus is your new superpower. 🚀`,
        hashtags: ['#socialmedia', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `The Behind-the-Scenes of ${post.title}`,
        content: `Ever wondered how we manage ${post.title}? Here is a quick look behind the scenes at our creative process and the unedited version of building a startup! ☕️`,
        hashtags: ['#behindthescenes', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `How do you handle ${post.title}?`,
        content: `What is your biggest bottleneck when trying to scale ${post.title}? Comment below and let's swap strategies! 👇`,
        hashtags: ['#discussion', `#${platformStr}`, `#${cleanTopic}`],
      },
    ];

    const generated = [];
    for (const v of variations) {
      const [inserted] = await this.db
        .insert(schema.contentSuggestions)
        .values({
          userId,
          postId,
          title: v.title,
          type: 'caption',
          content: v.content,
          hashtags: v.hashtags,
        })
        .returning();
      
      generated.push({
        ...inserted,
        feedback: null,
      });
    }

    return generated;
  }

  /**
   * Clear existing suggestions for a post and regenerate 4 new ones.
   */
  async regenerateForPost(postId: string, userId: string) {
    // Verify post exists and belongs to user
    const post = await this.db.query.contentCalendar.findFirst({
      where: (fields, { and, eq }) =>
        and(
          eq(fields.id, postId),
          eq(fields.userId, userId),
        ),
    });

    if (!post) {
      throw new NotFoundException('Calendar post not found.');
    }

    // Delete existing suggestions
    await this.db
      .delete(schema.contentSuggestions)
      .where(eq(schema.contentSuggestions.postId, postId));

    // Generate new ones
    return this.findForPost(postId, userId);
  }
}