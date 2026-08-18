import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublishingService } from './publishing.service';
import { ServiceTokenGuard } from '../auth/guards/service-token.guard';
import { PublishingLogEntry } from '@socialpilot/shared-types';

@ApiTags('publishing')
@Controller('publishing')
@UseGuards(ServiceTokenGuard)
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Post('dispatch')
  @ApiOperation({ summary: 'Dispatch a scheduled post to its target social platform' })
  dispatch(
    @Body()
    body: {
      scheduledPostId: string;
      platform: string;
      content: string;
      mediaUrl: string | null;
      socialAccountId: string;
      idempotencyKey?: string | null;
    },
  ) {
    return this.publishingService.dispatchPost({
      scheduledPostId: body.scheduledPostId,
      platform: body.platform,
      content: body.content,
      mediaUrl: body.mediaUrl,
      socialAccountId: body.socialAccountId,
      idempotencyKey: body.idempotencyKey || null,
    });
  }

  @Post('logs')
  @ApiOperation({ summary: 'Create a publishing log entry and update scheduled post status' })
  createLog(@Body() body: PublishingLogEntry) {
    return this.publishingService.createLogEntry(body);
  }
}
