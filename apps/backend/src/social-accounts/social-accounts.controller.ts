import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialAccountsService } from './social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@ApiTags('social-accounts')
@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly socialAccountsService: SocialAccountsService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new social account for the authenticated user' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSocialAccountDto,
  ) {
    return this.socialAccountsService.create(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all social accounts for the authenticated user' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.socialAccountsService.findAll(user.userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a social account (status / token expiration) for the authenticated user' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSocialAccountDto,
  ) {
    return this.socialAccountsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a social account for the authenticated user' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.socialAccountsService.remove(user.userId, id);
  }
}
