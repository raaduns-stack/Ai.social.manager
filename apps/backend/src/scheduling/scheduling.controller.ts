import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { ServiceTokenGuard } from '../auth/guards/service-token.guard';
import { CreateScheduledPostDto } from './dto/create-scheduled-post.dto';

@ApiTags('scheduling')
@Controller('scheduling')
@UseGuards(ServiceTokenGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('due')
  @ApiOperation({ summary: 'Get all scheduled posts that are due for publishing' })
  findDue() {
    return this.schedulingService.findDuePosts();
  }

  @Patch(':id/claim')
  @ApiOperation({ summary: 'Atomically claim a scheduled post for processing' })
  claim(
    @Param('id') id: string,
    @Body() body: { idempotencyKey?: string | null },
  ) {
    return this.schedulingService.claimPost(id, body.idempotencyKey || null);
  }

  @Post()
  @ApiOperation({ summary: 'Ingest and create a new scheduled post from an external service' })
  create(@Body() createScheduledPostDto: CreateScheduledPostDto) {
    return this.schedulingService.createScheduledPost(createScheduledPostDto);
  }
}
