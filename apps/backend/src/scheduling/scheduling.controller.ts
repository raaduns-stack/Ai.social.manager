import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { ServiceTokenGuard } from '../auth/guards/service-token.guard';

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
}
