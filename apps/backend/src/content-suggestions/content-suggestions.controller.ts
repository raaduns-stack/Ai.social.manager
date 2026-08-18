import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ContentSuggestionsService } from './content-suggestions.service';

import { GenerateCaptionDto } from './dto/generate-caption.dto';
import { GenerateIdeaDto } from './dto/generate-idea.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { N8nResponseDto } from './dto/n8n-response.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { N8nInternalAuthGuard } from '../auth/guards/n8n-internal-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller handling API routes for AI-driven content suggestions,
 * including post-specific variations, n8n webhook response callbacks,
 * and user feedback submissions.
 */
@ApiTags('content-suggestions')
@Controller('content-suggestions')
export class ContentSuggestionsController {
  constructor(
    private readonly contentSuggestionsService: ContentSuggestionsService,
  ) {}

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
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.findForPost(postId, user.userId);
  }

  /**
   * Regenerates suggestions for a specific calendar post by triggering n8n workflow.
   */
  @Post('post/:postId/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate suggestions for a specific calendar post' })
  regenerateForPost(
    @Param('postId', ParseUUIDPipe) postId: string,
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
  @ApiOperation({ summary: 'Generate a caption' })
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
  @ApiOperation({ summary: 'Generate a content idea' })
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
   * n8n Webhook Response Endpoint: Saves AI-generated suggestions back to SocialPilot.
   * Authenticated using X-N8N-API-KEY header.
   */
  @Post('webhook/n8n-response')
  @UseGuards(N8nInternalAuthGuard)
  @ApiHeader({ name: 'X-N8N-API-KEY', description: 'Internal n8n API Key' })
  @ApiOperation({ summary: '[Internal n8n] Receive generated suggestions from n8n workflow' })
  saveN8nSuggestions(@Body() dto: N8nResponseDto) {
    return this.contentSuggestionsService.saveN8nSuggestions(dto);
  }
}
