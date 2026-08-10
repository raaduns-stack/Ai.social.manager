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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
/**
 * Controller handling API routes for AI-driven or mock content suggestions,
 * including captions, content ideas, and user feedback submission.
 * All routes require JWT Authentication.
 */

@ApiTags('content-suggestions')
@ApiBearerAuth()
@Controller('content-suggestions')
@UseGuards(JwtAuthGuard)
/**
   * Retrieves all content suggestions created by or assigned to the authenticated user.
   */
export class ContentSuggestionsController {
  constructor(
    private readonly contentSuggestionsService: ContentSuggestionsService,
  ) {}

   @Get()
  @ApiOperation({ summary: 'Get all suggestions for the current user' })
  findAll(
    @CurrentUser() user: { userId: string },
  ) {
    return this.contentSuggestionsService.findAll(user.userId);
  }

  /**
   * Triggers generation of a text caption based on the provided business type.
   */
  @Post('caption')
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
}
