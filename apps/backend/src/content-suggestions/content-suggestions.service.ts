import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { desc, eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ConfigService } from '@nestjs/config';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { N8nResponseDto } from './dto/n8n-response.dto';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class ContentSuggestionsService {
  private readonly logger = new Logger(ContentSuggestionsService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly configService: ConfigService,
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
  async generateCaption(userId: string, businessType?: string) {
    const typeStr = businessType || 'Business';
    const caption = `Grow your ${typeStr} with amazing content today!`;

    const hashtags = [
      '#AI',
      '#Marketing',
      `#${typeStr.replace(/\s+/g, '')}`,
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
  async generateIdea(userId: string, businessType?: string) {
    const typeStr = businessType || 'Business';
    const idea = `Share a customer success story about your ${typeStr}.`;

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
   * If none exist, triggers n8n workflow using real postId and userId.
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

    // Trigger n8n workflow for fresh suggestion generation
    return this.triggerN8nGeneration(postId, userId);
  }

  /**
   * Clear existing suggestions for a post and trigger n8n regeneration.
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

    // Trigger n8n workflow
    return this.triggerN8nGeneration(postId, userId);
  }

  /**
   * Triggers the n8n AI Content Suggestions webhook with real database postId and userId.
   */
  async triggerN8nGeneration(postId: string, userId: string) {
    const post = await this.db.query.contentCalendar.findFirst({
      where: and(
        eq(schema.contentCalendar.id, postId),
        eq(schema.contentCalendar.userId, userId),
      ),
    });

    if (!post) {
      throw new NotFoundException('Calendar post not found or unauthorized.');
    }

    const webhookUrl =
      process.env.N8N_CONTENT_SUGGESTIONS_WEBHOOK_URL ||
      this.configService.get<string>('n8n.suggestionsWebhookUrl') ||
      this.configService.get<string>('N8N_CONTENT_SUGGESTIONS_WEBHOOK_URL') ||
      'https://n8n.raasocial.io/webhook/content-suggestions/generate';

    const payload = {
      postId: post.id,
      userId: post.userId,
    };

    this.logger.log(`Triggering n8n AI suggestion workflow at ${webhookUrl} for postId=${post.id}, userId=${userId}`);

    try {
      const response = await global.fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.logger.warn(`n8n webhook returned status ${response.status}`);
      } else {
        const responseData = await response.json().catch(() => null);
        this.logger.log(`n8n webhook responded successfully: ${JSON.stringify(responseData)}`);

        // If n8n returned variations directly in synchronous mode
        if (responseData && (responseData.variations || responseData.posts)) {
          const variations = responseData.variations || responseData.posts;
          return this.saveN8nSuggestions({
            postId: post.id,
            userId: post.userId,
            variations,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to reach n8n webhook: ${err.message}`);
    }

    // Check if suggestions were saved via asynchronous callback during webhook execution
    const newlySaved = await this.db.query.contentSuggestions.findMany({
      where: eq(schema.contentSuggestions.postId, postId),
      with: {
        feedback: {
          where: eq(schema.contentFeedback.userId, userId),
          limit: 1,
        },
      },
    });

    if (newlySaved && newlySaved.length > 0) {
      return newlySaved.map((s) => ({
        ...s,
        feedback: s.feedback?.[0] ? { reaction: s.feedback[0].reaction, rating: s.feedback[0].rating } : null,
      }));
    }

    // Fallback generation if n8n service is currently unreachable (e.g. offline dev mode)
    const platformStr = post.platform.replace(/\s+/g, '');
    const cleanTopic = post.title.replace(/[^\w]/g, '').substring(0, 30);

    const fallbackVariations = [
      {
        title: `5 Steps to Automate Your ${post.title}`,
        caption: `Want to master ${post.title}? Here are 5 simple steps we use to automate the entire workflow and save hours of manual labor. Which one are you trying first? 👇`,
        hashtags: ['#automation', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `Why 'Quantity' is No Longer King in ${post.title}`,
        caption: `Stop chasing the algorithm when it comes to ${post.title}. Focus on high-intent quality content that converts readers into buyers. Here is why focus is your new superpower. 🚀`,
        hashtags: ['#socialmedia', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `The Behind-the-Scenes of ${post.title}`,
        caption: `Ever wondered how we manage ${post.title}? Here is a quick look behind the scenes at our creative process and the unedited version of building a startup! ☕️`,
        hashtags: ['#behindthescenes', `#${platformStr}`, `#${cleanTopic}`],
      },
      {
        title: `How do you handle ${post.title}?`,
        caption: `What is your biggest bottleneck when trying to scale ${post.title}? Comment below and let's swap strategies! 👇`,
        hashtags: ['#discussion', `#${platformStr}`, `#${cleanTopic}`],
      },
    ];

    return this.saveN8nSuggestions({
      postId: post.id,
      userId: post.userId,
      variations: fallbackVariations,
    });
  }

  /**
   * Saves generated suggestions sent back from n8n callback to SocialPilot database.
   * Validates that the postId belongs to the specified userId.
   */
  async saveN8nSuggestions(dto: N8nResponseDto) {
    const post = await this.db.query.contentCalendar.findFirst({
      where: eq(schema.contentCalendar.id, dto.postId),
    });

    if (!post) {
      throw new NotFoundException(`Calendar post ${dto.postId} not found.`);
    }

    if (post.userId !== dto.userId) {
      throw new BadRequestException(
        `Authorization mismatch: Post ${dto.postId} does not belong to user ${dto.userId}.`,
      );
    }

    // Delete existing suggestions for this post before inserting new ones
    await this.db
      .delete(schema.contentSuggestions)
      .where(eq(schema.contentSuggestions.postId, dto.postId));

    const saved = [];
    for (const v of dto.variations) {
      const [inserted] = await this.db
        .insert(schema.contentSuggestions)
        .values({
          userId: dto.userId,
          postId: dto.postId,
          title: v.title || post.title,
          type: 'caption',
          content: v.caption,
          hashtags: v.hashtags || [],
        })
        .returning();

      saved.push({
        ...inserted,
        feedback: null,
      });
    }

    return saved;
  }

  /**
   * Approve a specific variation and reject others for the same post.
   */
  async approveSuggestion(id: string, userId: string) {
    const suggestion = await this.db.query.contentSuggestions.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.id, id), eq(fields.userId, userId)),
    });

    if (!suggestion) {
      throw new NotFoundException('Content suggestion not found');
    }

    if (!suggestion.postId) {
      throw new BadRequestException('Suggestion must belong to a post to be approved');
    }

    // Set the selected variation to APPROVED
    await this.db
      .update(schema.contentSuggestions)
      .set({ approvalStatus: 'APPROVED' })
      .where(eq(schema.contentSuggestions.id, id));

    // Set other variations belonging to the same post to REJECTED
    await this.db
      .update(schema.contentSuggestions)
      .set({ approvalStatus: 'REJECTED' })
      .where(
        and(
          eq(schema.contentSuggestions.postId, suggestion.postId),
          ne(schema.contentSuggestions.id, id)
        )
      );

    return { success: true };
  }

  /**
   * Request a revision for a specific suggestion
   */
  async requestRevision(id: string, userId: string, revisionNotes: string) {
    const suggestion = await this.db.query.contentSuggestions.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.id, id), eq(fields.userId, userId)),
      with: {
        post: true,
      },
    });

    if (!suggestion) {
      throw new NotFoundException('Content suggestion not found');
    }

    // Update status to REVISION_REQUESTED and save revision notes
    await this.db
      .update(schema.contentSuggestions)
      .set({
        approvalStatus: 'REVISION_REQUESTED',
        revisionNotes: revisionNotes,
      })
      .where(eq(schema.contentSuggestions.id, id));

    const webhookUrl = this.configService.get<string>('ai.n8nRevisionWebhookUrl');

    if (webhookUrl) {
      // Use the previously agreed revision payload structure
      const payload = {
        action: 'revise',
        postId: suggestion.postId,
        userId: suggestion.userId,
        variationId: suggestion.id,
        originalTitle: suggestion.title,
        originalContent: suggestion.content,
        originalHashtags: suggestion.hashtags,
        revisionNotes: revisionNotes,
        platform: suggestion.post?.platform,
      };

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('Failed to trigger n8n revision webhook:', error);
      }
    }

    return { success: true };
  }

  /**
   * Handle the webhook response from n8n
   */
  async handleN8nResponse(dto: N8nResponseDto) {
    if (!dto.variations || dto.variations.length === 0) {
      return { success: true, count: 0 };
    }

    const toInsert = dto.variations.map((v) => ({
      userId: dto.userId,
      postId: dto.postId,
      type: v.type,
      title: v.title,
      content: v.content,
      hashtags: v.hashtags || [],
      approvalStatus: 'PENDING_APPROVAL' as const,
    }));

    // If parentVariationId exists, it denotes a revision response. 
    // Since we don't have a parentVariationId field in the schema, 
    // we just store the new variations normally. They will be linked to the same post via postId.
    // The original variation remains in 'REVISION_REQUESTED' state.

    await this.db.insert(schema.contentSuggestions).values(toInsert);

    return { success: true };
  }
}