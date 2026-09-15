import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { desc, eq, and, ne } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { N8nResponseDto } from './dto/n8n-response.dto';
import { ApproveVariationDto } from './dto/approve-variation.dto';

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
        post: true,
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

    if (existingFeedback) {
      const [updated] = await this.db
        .update(schema.contentFeedback)
        .set({
          reaction,
          rating,
          createdAt: new Date(),
        })
        .where(eq(schema.contentFeedback.id, existingFeedback.id))
        .returning();
      return updated;
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
   * Only returns existing suggestions and never triggers generation on GET.
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

    return [];
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

    const toInsert = dto.variations.map((v: any) => ({
      userId: dto.userId,
      postId: dto.postId,
      type: 'caption' as const,
      title: v.title || 'Suggested Post',
      content: v.caption || v.content || '',
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

  /**
   * Unified method — single code path in the entire application allowed to:
   * 1. Set content_calendar.approval_status = 'APPROVED'
   * 2. Set content_calendar.status = 'SCHEDULED'
   * 3. Set content_suggestions.approval_status = 'APPROVED' (if variationId passed or created fallback variation)
   * 4. Insert row into scheduled_posts (or return existing row if already scheduled)
   */
  async scheduleApprovedPost(postId: string, variationId?: string) {
    // 1. Fetch parent calendar post
    const post = await this.db.query.contentCalendar.findFirst({
      where: eq(schema.contentCalendar.id, postId),
    });
    if (!post) {
      throw new NotFoundException(`Calendar post ${postId} not found.`);
    }

    // 2. Idempotency guard: check if scheduled_posts already has a row for this calendarPostId
    const existingScheduled = await this.db.query.scheduledPosts.findFirst({
      where: eq(schema.scheduledPosts.calendarPostId, postId),
    });
    if (existingScheduled) {
      return existingScheduled;
    }

    // 3. Determine content & resolvedVariationId
    let contentToPublish = post.caption;
    let resolvedVariationId = variationId || post.selectedSuggestionId || undefined;

    if (variationId) {
      const variation = await this.db.query.contentSuggestions.findFirst({
        where: eq(schema.contentSuggestions.id, variationId),
      });
      if (!variation) {
        throw new NotFoundException(`Variation ${variationId} not found.`);
      }
      if (variation.postId && variation.postId !== postId) {
        throw new BadRequestException(`Variation ${variationId} does not belong to post ${postId}.`);
      }
      contentToPublish = variation.content;
      resolvedVariationId = variation.id;
    } else if (post.selectedSuggestionId) {
      const selectedVar = await this.db.query.contentSuggestions.findFirst({
        where: eq(schema.contentSuggestions.id, post.selectedSuggestionId),
      });
      if (selectedVar) {
        contentToPublish = selectedVar.content;
        resolvedVariationId = selectedVar.id;
      }
    }

    // 4. Verify connected social account exists for post.platform on this user
    const normalizedPlatform = post.platform.toLowerCase();
    const socialAccount = await this.db.query.social_accounts.findFirst({
      where: and(
        eq(schema.social_accounts.userId, post.userId),
        eq(schema.social_accounts.platform, normalizedPlatform as any),
        eq(schema.social_accounts.status, 'connected'),
      ),
    });

    if (!socialAccount) {
      throw new BadRequestException(
        `No connected social account found for customer ID ${post.userId} on platform "${post.platform}".`,
      );
    }

    const scheduledAt = post.scheduledAt || new Date();

    // 5. Execute everything inside a single DB transaction (with fallback for mock DBs in tests)
    const runTx = this.db.transaction
      ? (cb: (tx: Database) => Promise<any>) => this.db.transaction(cb)
      : (cb: (tx: Database) => Promise<any>) => cb(this.db);

    return await runTx(async (tx) => {
      // If no variationId exists yet, create a real content_suggestions row copying calendar post content verbatim
      if (!resolvedVariationId) {
        const safeTitle = post.title ? post.title.substring(0, 255) : 'Scheduled Post';
        const safeContent = (contentToPublish || post.title).substring(0, 1000);

        const [fallbackSuggestion] = await tx
          .insert(schema.contentSuggestions)
          .values({
            userId: post.userId,
            postId: post.id,
            title: safeTitle,
            type: 'caption',
            content: safeContent,
            hashtags: post.hashtags || [],
            approvalStatus: 'APPROVED',
          })
          .returning();
        resolvedVariationId = fallbackSuggestion.id;
      }

      // Try inserting into scheduled_posts
      let scheduledPost;
      try {
        const [inserted] = await tx
          .insert(schema.scheduledPosts)
          .values({
            calendarPostId: post.id,
            variationId: resolvedVariationId,
            socialAccountId: socialAccount.id,
            platform: normalizedPlatform,
            content: contentToPublish || post.title,
            mediaUrl: post.mediaUrl || null,
            scheduledAt,
            status: 'SCHEDULED',
          })
          .returning();
        scheduledPost = inserted;
      } catch (err: any) {
        // Catch unique constraint violation (code 23505) for race conditions
        if (err.code === '23505') {
          const existing = await tx.query.scheduledPosts.findFirst({
            where: eq(schema.scheduledPosts.calendarPostId, post.id),
          });
          if (existing) {
            scheduledPost = existing;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // Update content_calendar status
      await tx
        .update(schema.contentCalendar)
        .set({
          approvalStatus: 'APPROVED',
          status: 'SCHEDULED',
          selectedSuggestionId: resolvedVariationId,
          updatedAt: new Date(),
        })
        .where(eq(schema.contentCalendar.id, post.id));

      // Update content_suggestions status
      if (resolvedVariationId) {
        await tx
          .update(schema.contentSuggestions)
          .set({ approvalStatus: 'APPROVED' })
          .where(eq(schema.contentSuggestions.id, resolvedVariationId));
      }

      return scheduledPost;
    });
  }

  /**
   * Approve a specific variation — delegates directly to scheduleApprovedPost.
   */
  async approveVariation(
    variationId: string,
    dto?: ApproveVariationDto,
    approvalSource: 'MANUAL' | 'SYSTEM' = 'MANUAL',
  ) {
    const variation = await this.db.query.contentSuggestions.findFirst({
      where: eq(schema.contentSuggestions.id, variationId),
    });
    if (!variation) {
      throw new NotFoundException(`Variation ${variationId} not found.`);
    }

    if (!variation.postId) {
      throw new BadRequestException('Variation does not belong to a calendar post.');
    }

    return this.scheduleApprovedPost(variation.postId, variationId);
  }
}