import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ContentSuggestionsService } from './content-suggestions.service';

import { GenerateCaptionDto } from './dto/generate-caption.dto';
import { GenerateIdeaDto } from './dto/generate-idea.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { N8nResponseDto } from './dto/n8n-response.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller handling API routes for AI-driven or mock content suggestions,
 * including captions, content ideas, user feedback submission, approvals, and revisions.
 */
@ApiTags('content-suggestions')
@Controller('content-suggestions')
export class ContentSuggestionsController {
  constructor(
    private readonly contentSuggestionsService: ContentSuggestionsService,
  ) { }

  /**
   * Retrieves all content suggestions created by or assigned to the authenticated user.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all suggestions for the current user' })
  findAll(
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.findAll(user.userId);
  }

  /**
   * Retrieves suggestions generated for a specific calendar post.
   */
  @Get('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggestions for a specific calendar post' })
  findForPost(
    @Param('postId') postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.findForPost(postId, user.userId);
  }

  /**
   * Regenerates suggestions for a specific calendar post.
   */
  @Post('post/:postId/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate suggestions for a specific calendar post' })
  regenerateForPost(
    @Param('postId') postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.regenerateForPost(postId, user.userId);
  }

  /**
   * Triggers generation of a text caption based on the provided business type.
   */
  @Post('caption')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a mock caption' })
  generateCaption(
    @CurrentUser() user: { userId: string },
    @Body() dto: GenerateCaptionDto,
  ) {
    return this.contentSuggestionsService.generateCaption(
      user.userId,
      dto.businessType,
    );
  }

  /**
   * Triggers generation of a creative content idea based on the provided business type.
   */
  @Post('idea')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a mock content idea' })
  generateIdea(
    @CurrentUser() user: { userId: string },
    @Body() dto: GenerateIdeaDto,
  ) {
    return this.contentSuggestionsService.generateIdea(
      user.userId,
      dto.businessType,
    );
  }

  /**
   * Records a user's reaction (up/down) and score rating for a specific content suggestion.
   */
  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save user feedback' })
  saveFeedback(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.contentSuggestionsService.saveFeedback(
      id,
      user.userId,
      dto.reaction,
      dto.rating,
    );
  }

  /**
   * Approves a single content suggestion variation, marking it as APPROVED and others as REJECTED.
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve one variation suggestion' })
  approveSuggestion(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.approveSuggestion(id, user.userId);
  }

  /**
   * Requests a revision on a suggestion variation, transitioning its status to REVISION_REQUESTED
   * and triggering n8n revision webhook.
   */
  @Post(':id/revision')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a revision for a suggestion variation' })
  requestRevision(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: RequestRevisionDto,
  ) {
    return this.contentSuggestionsService.requestRevision(id, user.userId, dto.revisionNotes);
  }

  /**
   * Public webhook endpoint called by n8n to deliver newly generated or revised variations.
   */
  @Post('webhook/n8n-response')
  @ApiOperation({ summary: 'Inbound webhook receiver for n8n generated/revised variations' })
  handleN8nResponse(
    @Body() dto: N8nResponseDto,
  ) {
    return this.contentSuggestionsService.handleN8nResponse(dto);
  }
}
